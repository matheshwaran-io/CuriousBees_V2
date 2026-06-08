import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, RequestStatus, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

  async onboardSupervisor(
    userId: string,
    data: {
      facultyId: string;
      departmentId: string;
      designation: string;
      employeeId: string;
      maxScholars?: number;
    }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.role !== Role.RESEARCH_SUPERVISOR) {
      throw new BadRequestException('User role is not RESEARCH_SUPERVISOR.');
    }
    if (user.onboardingCompleted) {
      throw new BadRequestException('User has already completed onboarding.');
    }

    // Verify faculty and department exist and are linked
    const dept = await this.prisma.department.findUnique({
      where: { id: data.departmentId },
      include: { faculty: true }
    });
    if (!dept || dept.facultyId !== data.facultyId) {
      throw new BadRequestException('Invalid department/faculty selection.');
    }

    // Verify employeeId is unique
    const existingProfile = await this.prisma.supervisorProfile.findUnique({
      where: { employeeId: data.employeeId },
    });
    if (existingProfile) {
      throw new BadRequestException('Employee ID is already in use by another supervisor.');
    }

    // Start transaction to create profile and update user
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.supervisorProfile.create({
        data: {
          userId,
          facultyId: data.facultyId,
          departmentId: data.departmentId,
          designation: data.designation,
          employeeId: data.employeeId,
          maxScholars: data.maxScholars ?? 5,
        },
      });

      return tx.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          status: UserStatus.ACTIVE,
          approved: true,
          employeeId: data.employeeId,
          departmentId: data.departmentId,
          department: dept.name,
          faculty: dept.faculty.name,
        },
        include: {
          supervisorProfile: true,
        },
      });
    });
  }

  async onboardScholar(
    userId: string,
    data: {
      facultyId: string;
      departmentId: string;
      researchArea: string;
      supervisorId: string;
    }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.role !== Role.RESEARCH_SCHOLAR) {
      throw new BadRequestException('User role is not RESEARCH_SCHOLAR.');
    }
    if (user.onboardingCompleted) {
      throw new BadRequestException('User has already completed onboarding.');
    }

    // Verify faculty and department
    const dept = await this.prisma.department.findUnique({
      where: { id: data.departmentId },
      include: { faculty: true }
    });
    if (!dept || dept.facultyId !== data.facultyId) {
      throw new BadRequestException('Invalid department/faculty selection.');
    }

    // Verify supervisor exists and is active/not at capacity
    const supervisor = await this.prisma.user.findUnique({
      where: { id: data.supervisorId },
      include: {
        supervisorProfile: true,
        _count: {
          select: {
            scholars: {
              where: {
                role: Role.RESEARCH_SCHOLAR,
                status: UserStatus.ACTIVE,
              }
            }
          }
        }
      }
    });

    if (!supervisor || supervisor.role !== Role.RESEARCH_SUPERVISOR || supervisor.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('Selected supervisor is not active.');
    }

    const currentScholars = supervisor._count.scholars;
    const maxScholars = supervisor.supervisorProfile?.maxScholars ?? 5;
    if (currentScholars >= maxScholars) {
      throw new BadRequestException('Selected supervisor is at full capacity.');
    }

    // Start transaction to create profile, update user, and create request
    return this.prisma.$transaction(async (tx) => {
      await tx.scholarProfile.create({
        data: {
          userId,
          facultyId: data.facultyId,
          departmentId: data.departmentId,
          researchArea: data.researchArea,
        },
      });

      await tx.scholarSupervisorRequest.create({
        data: {
          scholarId: userId,
          supervisorId: data.supervisorId,
          status: RequestStatus.PENDING,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          status: UserStatus.PENDING_SUPERVISOR_APPROVAL,
          approved: false,
          departmentId: data.departmentId,
          department: dept.name,
          faculty: dept.faculty.name,
        },
        include: {
          scholarProfile: true,
        },
      });

      // Trigger supervisor notification asynchronously (after tx resolves, but we can launch it here)
      // Wait, let's trigger it using notifications service
      try {
        await this.notifications.notifyScholarRegistrationSubmitted(userId, data.supervisorId);
      } catch (err) {
        // Log notification error but do not fail onboarding transaction
        console.error('Failed to notify supervisor on onboarding:', err);
      }

      return updatedUser;
    });
  }
}
