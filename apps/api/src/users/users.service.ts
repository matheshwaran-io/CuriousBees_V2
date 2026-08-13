import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileInput } from '@curiousbees/types';
import { UpdateProfileSchema } from '@curiousbees/shared-utils';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from './mail.service';
import { Role, UserStatus } from '@prisma/client';


@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: {
          include: {
            interest: true
          }
        }
      }
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Validate with shared Zod schema
    const parsed = UpdateProfileSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0].message);
    }

    const { name, department, departmentId, bio, interests } = parsed.data;

    // Update user base fields
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(department !== undefined && { department }),
        ...(departmentId !== undefined && { departmentId }),
        ...(bio !== undefined && { bio })
      }
    });

    // If interests are provided, sync them
    if (interests) {
      // 1. Delete all existing user interests
      await this.prisma.userInterest.deleteMany({
        where: { userId }
      });

      // 2. Add new user interests (upsert research interest if it doesn't exist)
      for (const interestName of interests) {
        const cleanedName = interestName.trim();
        if (cleanedName.length === 0) continue;

        const interestObj = await this.prisma.researchInterest.upsert({
          where: { name: cleanedName },
          update: {},
          create: { name: cleanedName }
        });

        await this.prisma.userInterest.create({
          data: {
            userId,
            interestId: interestObj.id
          }
        });
      }
    }

    return this.getProfile(userId);
  }

  async getCollaborators(userId: string, search?: string, department?: string) {
    const requester = await this.prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { interests: true } 
    });
    if (!requester) throw new BadRequestException('User not found');

    const requesterInterestIds = requester.interests.map((i: any) => i.interestId);

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        role: { in: ['RESEARCH_SCHOLAR', 'RESEARCH_SUPERVISOR'] },
        ...(requesterInterestIds.length > 0 && {
          interests: {
            some: {
              interestId: { in: requesterInterestIds }
            }
          }
        }),
        ...(department && { department }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { bio: { contains: search, mode: 'insensitive' } },
            {
              interests: {
                some: {
                  interest: {
                    name: { contains: search, mode: 'insensitive' }
                  }
                }
              }
            }
          ]
        })
      },
      include: {
        interests: {
          include: {
            interest: true
          }
        }
      },
      take: 20
    });

    const connections = await this.prisma.researchConnection.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { receiverId: userId }
        ]
      }
    });

    return users.map(user => {
      const conn = connections.find(c => 
        (c.requesterId === userId && c.receiverId === user.id) ||
        (c.receiverId === userId && c.requesterId === user.id)
      );
      return {
        ...user,
        connectionStatus: conn ? conn.status : 'NONE'
      };
    });
  }

  async toggleConnection(requesterId: string, receiverId: string) {
    const existing = await this.prisma.researchConnection.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId }
        ]
      }
    });

    if (existing) {
      await this.prisma.researchConnection.delete({ where: { id: existing.id } });
      return { status: 'connect' };
    } else {
      await this.prisma.researchConnection.create({
        data: { requesterId, receiverId, status: 'PENDING' }
      });
      return { status: 'pending' };
    }
  }

  async getAllInterests() {
    return this.prisma.researchInterest.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async requestSupervisor(scholarId: string, supervisorId: string) {
    // Verify supervisor exists and is Faculty
    const supervisor = await this.prisma.user.findUnique({
      where: { id: supervisorId }
    });
    if (!supervisor || supervisor.role !== Role.RESEARCH_SUPERVISOR) {
      throw new BadRequestException('Selected supervisor must be a registered faculty member.');
    }

    return this.prisma.user.update({
      where: { id: scholarId },
      data: { supervisorId, supervisorEmail: supervisor.email, approved: false }
    });
  }

  async getApprovals(supervisorId: string) {
    return this.prisma.user.findMany({
      where: {
        supervisorId,
        approved: false,
        role: Role.RESEARCH_SCHOLAR
      },
      include: {
        interests: {
          include: {
            interest: true
          }
        }
      }
    });
  }

  async approveScholar(supervisorId: string, scholarId: string) {
    const scholar = await this.prisma.user.findFirst({
      where: {
        id: scholarId,
        supervisorId
      }
    });

    if (!scholar) {
      throw new BadRequestException('Scholar mapping request not found for this supervisor.');
    }

    // Approve the scholar
    const approvedUser = await this.prisma.user.update({
      where: { id: scholarId },
      data: { 
        approved: true,
        status: UserStatus.ACTIVE,
        approvedBy: supervisorId,
        approvedAt: new Date()
      }
    });

    // Write an audit log entry
    await this.prisma.auditLog.create({
      data: {
        userId: supervisorId,
        action: 'APPROVE_SCHOLAR',
        details: `Supervisor approved scholar ${scholar.name || scholar.email} (${scholarId})`
      }
    });

    // Trigger notification
    await this.notificationsService.notifyScholarApproved(scholarId, supervisorId);

    return approvedUser;
  }

  async declineScholar(supervisorId: string, scholarId: string) {
    const scholar = await this.prisma.user.findFirst({
      where: {
        id: scholarId,
        supervisorId
      }
    });

    if (!scholar) {
      throw new BadRequestException('Scholar mapping request not found for this supervisor.');
    }

    // Reject the scholar
    const declined = await this.prisma.user.update({
      where: { id: scholarId },
      data: { approved: false, status: UserStatus.REJECTED }
    });

    // Write an audit log entry
    await this.prisma.auditLog.create({
      data: {
        userId: supervisorId,
        action: 'DECLINE_SCHOLAR',
        details: `Supervisor declined scholar ${scholar.name || scholar.email} (${scholarId})`
      }
    });

    // Trigger notification
    await this.notificationsService.notifyScholarRejected(scholarId, supervisorId);

    return declined;
  }

  async getAllUsers(adminId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.INSTITUTE_ADMIN) {
      throw new ForbiddenException('Only administrators can access this system management API.');
    }

    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateUserRole(adminId: string, targetUserId: string, role: 'SUPERVISOR' | 'SCHOLAR' | 'INSTITUTE_ADMIN' | 'ADMIN') {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.INSTITUTE_ADMIN) {
      throw new ForbiddenException('Only administrators can change user roles.');
    }

    let prismaRole: Role;
    if (role === 'SUPERVISOR' || (role as any) === 'RESEARCH_SUPERVISOR') prismaRole = Role.RESEARCH_SUPERVISOR;
    else if (role === 'SCHOLAR' || (role as any) === 'RESEARCH_SCHOLAR') prismaRole = Role.RESEARCH_SCHOLAR;
    else prismaRole = Role.INSTITUTE_ADMIN;

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { 
        role: prismaRole,
        approved: prismaRole === Role.RESEARCH_SUPERVISOR || prismaRole === Role.INSTITUTE_ADMIN ? true : undefined
      }
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE_USER_ROLE',
        details: `Admin changed role of user ${updated.email} to ${prismaRole}`
      }
    });

    return updated;
  }

  async getAuditLogs(adminId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.INSTITUTE_ADMIN) {
      throw new ForbiddenException('Only administrators can view audit logs.');
    }

    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  async getSupervisors() {
    return this.prisma.user.findMany({
      where: {
        role: Role.RESEARCH_SUPERVISOR,
        approved: true,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        image: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getMyScholars(supervisorId: string) {
    return this.prisma.user.findMany({
      where: {
        supervisorId,
        role: Role.RESEARCH_SCHOLAR,
        approved: true,
      },
      include: {
        interests: {
          include: { interest: true },
        },
        publications: true,
        submittedReports: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async suspendUser(adminId: string, targetUserId: string, suspended: boolean) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.INSTITUTE_ADMIN) {
      throw new ForbiddenException('Only administrators can suspend or unsuspend users.');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { suspended },
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: suspended ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
        details: `Admin ${suspended ? 'suspended' : 'unsuspended'} user ${updated.email}`,
      },
    });

    return updated;
  }

  async completeOnboarding(
    userId: string,
    payload: { role: 'SCHOLAR' | 'SUPERVISOR'; supervisorId?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User has already completed onboarding.');
    }

    let status: UserStatus = UserStatus.PENDING_SUPERVISOR_APPROVAL;
    let supervisorEmail = null;

    if (payload.role === 'SCHOLAR') {
      if (!payload.supervisorId) {
        throw new BadRequestException('Research Scholars must select a supervisor.');
      }
      const supervisor = await this.prisma.user.findUnique({ where: { id: payload.supervisorId } });
      if (!supervisor || supervisor.role !== Role.RESEARCH_SUPERVISOR) {
        throw new BadRequestException('Invalid supervisor selected.');
      }
      status = UserStatus.PENDING_SUPERVISOR_APPROVAL;
      supervisorEmail = supervisor.email;
    } else if (payload.role === 'SUPERVISOR') {
      status = UserStatus.ACTIVE; // Supervisors go active immediately after onboarding
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: payload.role === 'SCHOLAR' ? Role.RESEARCH_SCHOLAR : Role.RESEARCH_SUPERVISOR,
        status,
        supervisorId: payload.role === 'SCHOLAR' ? payload.supervisorId : null,
        supervisorEmail
      }
    });

    return updated;
  }

  async approveSupervisor(adminId: string, supervisorId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.INSTITUTE_ADMIN) {
      throw new ForbiddenException('Only administrators can approve supervisors.');
    }

    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.role !== Role.RESEARCH_SUPERVISOR) {
      throw new BadRequestException('User is not a Research Supervisor.');
    }

    const approvedUser = await this.prisma.user.update({
      where: { id: supervisorId },
      data: { 
        approved: true,
        status: UserStatus.ACTIVE,
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'APPROVE_SUPERVISOR',
        details: `Admin approved supervisor ${supervisor.name || supervisor.email} (${supervisorId})`
      }
    });

    // Trigger notification
    await this.notificationsService.notifySupervisorApproved(supervisorId, adminId);

    return approvedUser;
  }

  async declineSupervisor(adminId: string, supervisorId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.INSTITUTE_ADMIN) {
      throw new ForbiddenException('Only administrators can decline supervisors.');
    }

    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.role !== Role.RESEARCH_SUPERVISOR) {
      throw new BadRequestException('User is not a Research Supervisor.');
    }

    const declined = await this.prisma.user.update({
      where: { id: supervisorId },
      data: { 
        approved: false,
        status: UserStatus.REJECTED,
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DECLINE_SUPERVISOR',
        details: `Admin declined supervisor ${supervisor.name || supervisor.email} (${supervisorId})`
      }
    });

    // Trigger notification
    await this.notificationsService.notifySupervisorRejected(supervisorId, adminId);

    return declined;
  }

  async register(userId: string, input: any) {
    console.log(`[BACKEND TRACE] register() called with userId=${userId}`);
    console.log(`[BACKEND TRACE] register() input payload:`, JSON.stringify(input));
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User profile not found in database.');
    }

    const email = user.email.toLowerCase();
    const { name, role, departmentId, supervisorId, employeeId, faculty } = input;

    // Verify department exists
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      throw new BadRequestException('Selected department does not exist.');
    }

    let status: UserStatus = UserStatus.PENDING_SUPERVISOR_APPROVAL;
    let supervisorEmail = null;

    if (role === 'SCHOLAR') {
      if (!employeeId) {
        throw new BadRequestException('Research Scholars must provide a Registration Number.');
      }
      if (!supervisorId) {
        throw new BadRequestException('Research Scholars must select a research supervisor.');
      }
      const supervisor = await this.prisma.user.findUnique({
        where: { id: supervisorId },
      });
      if (!supervisor || supervisor.role !== Role.RESEARCH_SUPERVISOR) {
        throw new BadRequestException('Selected research supervisor is invalid.');
      }
      if (supervisor.status !== UserStatus.ACTIVE) {
        throw new BadRequestException('Selected research supervisor is not active.');
      }
      supervisorEmail = supervisor.email;
      status = UserStatus.PENDING_SUPERVISOR_APPROVAL;
    } else if (role === 'SUPERVISOR') {
      if (!employeeId) {
        throw new BadRequestException('Research Supervisors must provide an Employee ID.');
      }
      status = UserStatus.PENDING_SUPERVISOR_APPROVAL;
    } else {
      throw new BadRequestException('Invalid registration role.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name,
        role: role === 'SCHOLAR' ? Role.RESEARCH_SCHOLAR : Role.RESEARCH_SUPERVISOR,
        departmentId,
        department: department.name,
        faculty: faculty || null,
        supervisorId: role === 'SCHOLAR' ? supervisorId : null,
        supervisorEmail,
        employeeId: employeeId || null,
        status,
        approved: false,
      },
    });

    console.log(`[BACKEND TRACE] User database sync completed for ${email}. Status assigned: ${status}`);

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_REGISTER',
        details: `User ${email} registered as ${role}. Status set to ${status}.`,
      },
    });

    // Trigger notification
    if (role === 'SCHOLAR' && supervisorId) {
      await this.notificationsService.notifyScholarRegistrationSubmitted(userId, supervisorId);
    } else if (role === 'SUPERVISOR') {
      await this.notificationsService.notifySupervisorRegistrationSubmitted(userId);
      // Send email alert to Institute Admin
      await this.mailService.sendSupervisorRegistrationAlert({
        name: updatedUser.name || email,
        email: updatedUser.email,
        department: department.name,
        employeeId: employeeId || 'N/A',
      });
    }

    return updatedUser;
  }

  async getPendingSupervisors(adminId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.INSTITUTE_ADMIN) {
      throw new ForbiddenException('Only administrators can access pending supervisor requests.');
    }
    return this.prisma.user.findMany({
      where: {
        role: Role.RESEARCH_SUPERVISOR,
        status: UserStatus.PENDING_SUPERVISOR_APPROVAL,
        approved: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- RESEARCHER NETWORK (FOLLOW) ---

  async getResearchers(userId: string, query: { q?: string; role?: string; department?: string; interest?: string; page?: number; limit?: number }) {
    const { q, role, department, interest, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }
    if (department) {
      where.department = { equals: department, mode: 'insensitive' };
    }
    if (interest) {
      where.interests = {
        some: {
          interest: {
            name: { equals: interest, mode: 'insensitive' }
          }
        }
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          role: true,
          department: true,
          bio: true,
          image: true,
          interests: { include: { interest: true } },
          followers: { where: { followerId: userId }, select: { id: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where }),
    ]);

    // get current user interests to compute shared interests
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { interests: { include: { interest: true } } }
    });
    const myInterests = currentUser?.interests.map(i => i.interest.name) || [];

    const items = users.map(user => {
      const userInterests = user.interests.map(i => i.interest.name);
      const sharedInterests = userInterests.filter(i => myInterests.includes(i));
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        department: user.department,
        bio: user.bio,
        image: user.image,
        researchInterests: userInterests,
        isFollowing: user.followers.length > 0,
        sharedInterestCount: sharedInterests.length,
        sharedInterests
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total
      }
    };
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { id: followingId } });
    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    try {
      await this.prisma.userFollow.create({
        data: {
          followerId,
          followingId
        }
      });
    } catch (e) {
      // Ignore if already following (Unique constraint violation)
    }

    return { success: true };
  }

  async unfollowUser(followerId: string, followingId: string) {
    await this.prisma.userFollow.deleteMany({
      where: {
        followerId,
        followingId
      }
    });

    return { success: true };
  }

  async getFollowStatus(userId: string, targetId: string) {
    const [isFollowing, followersCount, followingCount] = await Promise.all([
      this.prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetId
          }
        }
      }),
      this.prisma.userFollow.count({ where: { followingId: targetId } }),
      this.prisma.userFollow.count({ where: { followerId: targetId } }),
    ]);

    return {
      isFollowing: !!isFollowing,
      followersCount,
      followingCount
    };
  }

  async getFollowers(targetId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [followers, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followingId: targetId },
        skip,
        take: limit,
        include: {
          follower: {
            select: { id: true, name: true, role: true, department: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.userFollow.count({ where: { followingId: targetId } })
    ]);

    return {
      items: followers.map(f => f.follower),
      pagination: { page, limit, total }
    };
  }

  async getFollowing(targetId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [following, total] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followerId: targetId },
        skip,
        take: limit,
        include: {
          following: {
            select: { id: true, name: true, role: true, department: true, image: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.userFollow.count({ where: { followerId: targetId } })
    ]);

    return {
      items: following.map(f => f.following),
      pagination: { page, limit, total }
    };
  }

  // --- DOMAIN FOLLOW ---
  async followDomain(userId: string, domain: string) {
    const cleanDomain = domain.trim();
    if (!cleanDomain) throw new BadRequestException('Invalid domain');

    try {
      await this.prisma.domainFollow.create({
        data: { userId, domain: cleanDomain }
      });
    } catch (e) {
      // Ignore unique constraint error if already followed
    }

    return { success: true, domain: cleanDomain };
  }

  async unfollowDomain(userId: string, domain: string) {
    const cleanDomain = domain.trim();
    await this.prisma.domainFollow.deleteMany({
      where: { userId, domain: cleanDomain }
    });

    return { success: true, domain: cleanDomain };
  }

  async getFollowedDomains(userId: string) {
    const records = await this.prisma.domainFollow.findMany({
      where: { userId },
      select: { domain: true }
    });
    return records.map(r => r.domain);
  }

  // --- TOPIC / HASHTAG FOLLOW ---
  async followTopic(userId: string, topic: string) {
    const cleanTopic = topic.trim().replace(/^#/, '');
    if (!cleanTopic) throw new BadRequestException('Invalid topic');

    try {
      await this.prisma.topicFollow.create({
        data: { userId, topic: cleanTopic }
      });
    } catch (e) {
      // Ignore unique constraint error if already followed
    }

    return { success: true, topic: cleanTopic };
  }

  async unfollowTopic(userId: string, topic: string) {
    const cleanTopic = topic.trim().replace(/^#/, '');
    await this.prisma.topicFollow.deleteMany({
      where: { userId, topic: cleanTopic }
    });

    return { success: true, topic: cleanTopic };
  }

  async getFollowedTopics(userId: string) {
    const records = await this.prisma.topicFollow.findMany({
      where: { userId },
      select: { topic: true }
    });
    return records.map(r => r.topic);
  }

  // --- COMPREHENSIVE USER FOLLOW STATE ---
  async getUserFollowState(userId: string) {
    const [userFollows, domainFollows, topicFollows] = await Promise.all([
      this.prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      }),
      this.prisma.domainFollow.findMany({
        where: { userId },
        select: { domain: true }
      }),
      this.prisma.topicFollow.findMany({
        where: { userId },
        select: { topic: true }
      })
    ]);

    return {
      followedUserIds: userFollows.map(f => f.followingId),
      followedDomains: domainFollows.map(d => d.domain),
      followedTopics: topicFollows.map(t => t.topic)
    };
  }
}
