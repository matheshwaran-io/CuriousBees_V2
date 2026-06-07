import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileInput } from '@curiousbees/types';
import { UpdateProfileSchema } from '@curiousbees/shared-utils';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
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
    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
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
    if (!supervisor || supervisor.role !== 'SUPERVISOR') {
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
        role: 'SCHOLAR'
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
        status: 'ACTIVE',
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
      data: { approved: false, status: 'REJECTED' }
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
    if (!admin || admin.role !== 'INSTITUTE_ADMIN') {
      throw new ForbiddenException('Only administrators can access this system management API.');
    }

    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateUserRole(adminId: string, targetUserId: string, role: 'SUPERVISOR' | 'SCHOLAR' | 'INSTITUTE_ADMIN') {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'INSTITUTE_ADMIN') {
      throw new ForbiddenException('Only administrators can change user roles.');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { 
        role,
        approved: role === 'SUPERVISOR' || role === 'INSTITUTE_ADMIN' ? true : undefined
      }
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE_USER_ROLE',
        details: `Admin changed role of user ${updated.email} to ${role}`
      }
    });

    return updated;
  }

  async getAuditLogs(adminId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'INSTITUTE_ADMIN') {
      throw new ForbiddenException('Only administrators can view audit logs.');
    }

    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  async getSupervisors() {
    return this.prisma.user.findMany({
      where: { role: 'SUPERVISOR' },
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
        role: 'SCHOLAR',
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
    if (!admin || admin.role !== 'INSTITUTE_ADMIN') {
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
    if (user.status === 'ACTIVE') {
      throw new BadRequestException('User has already completed onboarding.');
    }

    let status: import('@prisma/client').UserStatus = 'PENDING_SUPERVISOR_APPROVAL';
    let supervisorEmail = null;

    if (payload.role === 'SCHOLAR') {
      if (!payload.supervisorId) {
        throw new BadRequestException('Research Scholars must select a supervisor.');
      }
      const supervisor = await this.prisma.user.findUnique({ where: { id: payload.supervisorId } });
      if (!supervisor || supervisor.role !== 'SUPERVISOR') {
        throw new BadRequestException('Invalid supervisor selected.');
      }
      status = 'PENDING_SUPERVISOR_APPROVAL';
      supervisorEmail = supervisor.email;
    } else if (payload.role === 'SUPERVISOR') {
      status = 'PENDING_ADMIN_APPROVAL';
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: payload.role,
        status,
        supervisorId: payload.role === 'SCHOLAR' ? payload.supervisorId : null,
        supervisorEmail
      }
    });

    return updated;
  }

  async approveSupervisor(adminId: string, supervisorId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'INSTITUTE_ADMIN') {
      throw new ForbiddenException('Only administrators can approve supervisors.');
    }

    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.role !== 'SUPERVISOR') {
      throw new BadRequestException('User is not a Research Supervisor.');
    }

    const approvedUser = await this.prisma.user.update({
      where: { id: supervisorId },
      data: { 
        approved: true,
        status: 'ACTIVE',
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
    if (!admin || admin.role !== 'INSTITUTE_ADMIN') {
      throw new ForbiddenException('Only administrators can decline supervisors.');
    }

    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.role !== 'SUPERVISOR') {
      throw new BadRequestException('User is not a Research Supervisor.');
    }

    const declined = await this.prisma.user.update({
      where: { id: supervisorId },
      data: { 
        approved: false,
        status: 'REJECTED',
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
    if (!email.endsWith('@srmist.edu.in')) {
      throw new BadRequestException('Only SRM Institute email addresses are allowed.');
    }

    const { name, role, departmentId, supervisorId, employeeId } = input;

    // Verify department exists
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      throw new BadRequestException('Selected department does not exist.');
    }

    let status: import('@prisma/client').UserStatus = 'PENDING_SUPERVISOR_APPROVAL';
    let supervisorEmail = null;

    if (role === 'SCHOLAR') {
      if (!supervisorId) {
        throw new BadRequestException('Research Scholars must select a research supervisor.');
      }
      const supervisor = await this.prisma.user.findUnique({
        where: { id: supervisorId },
      });
      if (!supervisor || supervisor.role !== 'SUPERVISOR') {
        throw new BadRequestException('Selected research supervisor is invalid.');
      }
      if (!supervisor.approved || supervisor.status !== 'ACTIVE') {
        throw new BadRequestException('Selected research supervisor is not active.');
      }
      supervisorEmail = supervisor.email;
      status = 'PENDING_SUPERVISOR_APPROVAL';
    } else if (role === 'SUPERVISOR') {
      if (!employeeId) {
        throw new BadRequestException('Research Supervisors must provide an Employee ID.');
      }
      status = 'PENDING_ADMIN_APPROVAL';
    } else {
      throw new BadRequestException('Invalid registration role.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name,
        role,
        departmentId,
        department: department.name,
        supervisorId: role === 'SCHOLAR' ? supervisorId : null,
        supervisorEmail,
        employeeId: role === 'SUPERVISOR' ? employeeId : null,
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
    }

    return updatedUser;
  }

  async getPendingSupervisors(adminId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'INSTITUTE_ADMIN') {
      throw new ForbiddenException('Only administrators can access pending supervisor requests.');
    }
    return this.prisma.user.findMany({
      where: {
        role: 'SUPERVISOR',
        status: 'PENDING_ADMIN_APPROVAL',
        approved: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
