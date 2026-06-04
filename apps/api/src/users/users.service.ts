import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileInput } from '@curiousbees/types';
import { UpdateProfileSchema } from '@curiousbees/shared-utils';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    if (!supervisor || supervisor.role !== 'RESEARCH_SUPERVISOR') {
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
        role: 'RESEARCH_SCHOLAR'
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
        status: 'APPROVED',
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

    // Reset supervisorId to null so they can request another supervisor
    const declined = await this.prisma.user.update({
      where: { id: scholarId },
      data: { supervisorId: null, supervisorEmail: null, approved: false }
    });

    // Write an audit log entry
    await this.prisma.auditLog.create({
      data: {
        userId: supervisorId,
        action: 'DECLINE_SCHOLAR',
        details: `Supervisor declined scholar ${scholar.name || scholar.email} (${scholarId})`
      }
    });

    return declined;
  }

  async getAllUsers(adminId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'INSTITUTION_ADMIN') {
      throw new ForbiddenException('Only administrators can access this system management API.');
    }

    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateUserRole(adminId: string, targetUserId: string, role: 'RESEARCH_SUPERVISOR' | 'RESEARCH_SCHOLAR' | 'INSTITUTION_ADMIN') {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'INSTITUTION_ADMIN') {
      throw new ForbiddenException('Only administrators can change user roles.');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { 
        role,
        approved: role === 'RESEARCH_SUPERVISOR' || role === 'INSTITUTION_ADMIN' ? true : undefined
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
    if (!admin || admin.role !== 'INSTITUTION_ADMIN') {
      throw new ForbiddenException('Only administrators can view audit logs.');
    }

    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  async getSupervisors() {
    return this.prisma.user.findMany({
      where: { role: 'RESEARCH_SUPERVISOR' },
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
        role: 'RESEARCH_SCHOLAR',
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
    if (!admin || admin.role !== 'INSTITUTION_ADMIN') {
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
    payload: { role: 'RESEARCH_SCHOLAR' | 'RESEARCH_SUPERVISOR'; supervisorId?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.status !== 'ONBOARDING') {
      throw new BadRequestException('User has already completed onboarding.');
    }

    let status = 'ONBOARDING';
    let supervisorEmail = null;

    if (payload.role === 'RESEARCH_SCHOLAR') {
      if (!payload.supervisorId) {
        throw new BadRequestException('Research Scholars must select a supervisor.');
      }
      const supervisor = await this.prisma.user.findUnique({ where: { id: payload.supervisorId } });
      if (!supervisor || supervisor.role !== 'RESEARCH_SUPERVISOR') {
        throw new BadRequestException('Invalid supervisor selected.');
      }
      status = 'PENDING_SUPERVISOR';
      supervisorEmail = supervisor.email;
    } else if (payload.role === 'RESEARCH_SUPERVISOR') {
      status = 'PENDING_ADMIN';
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: payload.role,
        status,
        supervisorId: payload.role === 'RESEARCH_SCHOLAR' ? payload.supervisorId : null,
        supervisorEmail
      }
    });

    return updated;
  }

  async approveSupervisor(adminId: string, supervisorId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'INSTITUTION_ADMIN') {
      throw new ForbiddenException('Only administrators can approve supervisors.');
    }

    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.role !== 'RESEARCH_SUPERVISOR') {
      throw new BadRequestException('User is not a Research Supervisor.');
    }

    const approvedUser = await this.prisma.user.update({
      where: { id: supervisorId },
      data: { 
        approved: true,
        status: 'APPROVED',
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

    return approvedUser;
  }

  async declineSupervisor(adminId: string, supervisorId: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'INSTITUTION_ADMIN') {
      throw new ForbiddenException('Only administrators can decline supervisors.');
    }

    const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!supervisor || supervisor.role !== 'RESEARCH_SUPERVISOR') {
      throw new BadRequestException('User is not a Research Supervisor.');
    }

    const declined = await this.prisma.user.update({
      where: { id: supervisorId },
      data: { 
        approved: false,
        status: 'ONBOARDING', // Send them back to onboarding or reject them
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DECLINE_SUPERVISOR',
        details: `Admin declined supervisor ${supervisor.name || supervisor.email} (${supervisorId})`
      }
    });

    return declined;
  }
}
