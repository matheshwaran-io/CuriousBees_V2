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

    const { name, role, department, bio, interests } = parsed.data;

    // Update user base fields
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(role && { role: role as any }),
        ...(department !== undefined && { department }),
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
    if (!supervisor || supervisor.role !== 'FACULTY') {
      throw new BadRequestException('Selected supervisor must be a registered faculty member.');
    }

    return this.prisma.user.update({
      where: { id: scholarId },
      data: { supervisorId, isApproved: false }
    });
  }

  async getApprovals(supervisorId: string) {
    return this.prisma.user.findMany({
      where: {
        supervisorId,
        isApproved: false,
        role: 'PHD_SCHOLAR'
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
    const approved = await this.prisma.user.update({
      where: { id: scholarId },
      data: { isApproved: true }
    });

    // Write an audit log entry
    await this.prisma.auditLog.create({
      data: {
        userId: supervisorId,
        action: 'APPROVE_SCHOLAR',
        details: `Supervisor approved scholar ${scholar.name || scholar.email} (${scholarId})`
      }
    });

    return approved;
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
      data: { supervisorId: null, isApproved: false }
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
    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can access this system management API.');
    }

    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateUserRole(adminId: string, targetUserId: string, role: 'FACULTY' | 'PHD_SCHOLAR' | 'ADMIN') {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can change user roles.');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { 
        role,
        isApproved: role === 'FACULTY' || role === 'ADMIN' ? true : undefined
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
    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can view audit logs.');
    }

    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }
}
