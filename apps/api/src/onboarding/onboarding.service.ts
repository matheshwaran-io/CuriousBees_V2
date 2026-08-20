import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, RequestStatus, Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../users/mail.service';
import { MAX_SCHOLARS_PER_SUPERVISOR } from '@curiousbees/constants';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private mailService: MailService,
  ) {}

  async onboardSupervisor(
    userId: string,
    data: {
      facultyId?: string;
      departmentId?: string;
      designation?: string;
      employeeId?: string;
      researchArea: string;
      maxScholars?: number;
    }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { supervisorProfile: true }
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.role && user.role !== Role.RESEARCH_SUPERVISOR && user.role !== Role.INSTITUTE_ADMIN) {
      throw new BadRequestException('User already has a different role assigned.');
    }
    if (user.onboardingCompleted && user.departmentId) {
      throw new BadRequestException('User has already completed onboarding.');
    }

    // Prioritize admin-provisioned department, faculty, designation, employeeId
    let effectiveDepartmentId = user.departmentId || user.supervisorProfile?.departmentId || data.departmentId;

    if (!effectiveDepartmentId && user.department) {
      const foundDept = await this.prisma.department.findFirst({
        where: { name: { equals: user.department.trim(), mode: 'insensitive' } }
      });
      if (foundDept) {
        effectiveDepartmentId = foundDept.id;
      }
    }

    if (!effectiveDepartmentId) {
      const fallbackDept = await this.prisma.department.findFirst();
      if (fallbackDept) {
        effectiveDepartmentId = fallbackDept.id;
      } else {
        throw new BadRequestException('Department selection is required.');
      }
    }

    const dept = await this.prisma.department.findUnique({
      where: { id: effectiveDepartmentId },
      include: { faculty: true }
    });
    if (!dept) {
      throw new BadRequestException('Invalid department selection.');
    }

    const effectiveFacultyId = user.supervisorProfile?.facultyId || data.facultyId || dept.facultyId;
    if (dept.facultyId !== effectiveFacultyId) {
      throw new BadRequestException('Invalid department/faculty selection.');
    }

    const effectiveDesignation = user.supervisorProfile?.designation || data.designation || 'Supervisor';
    const effectiveEmployeeId = user.employeeId || user.supervisorProfile?.employeeId || data.employeeId || `EMP-${Date.now()}`;

    // Verify employeeId is unique if not already set for this user
    if (!user.employeeId && !user.supervisorProfile?.employeeId && effectiveEmployeeId) {
      const existingProfile = await this.prisma.supervisorProfile.findFirst({
        where: { employeeId: effectiveEmployeeId, NOT: { userId } },
      });
      if (existingProfile) {
        throw new BadRequestException('Employee ID is already in use by another supervisor.');
      }
    }

    // Start transaction to create profile and update user
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.supervisorProfile.upsert({
        where: { userId },
        create: {
          userId,
          facultyId: effectiveFacultyId,
          departmentId: effectiveDepartmentId,
          designation: effectiveDesignation,
          employeeId: effectiveEmployeeId,
          researchArea: data.researchArea,
          maxScholars: MAX_SCHOLARS_PER_SUPERVISOR,
        },
        update: {
          facultyId: effectiveFacultyId,
          departmentId: effectiveDepartmentId,
          designation: effectiveDesignation,
          employeeId: effectiveEmployeeId,
          researchArea: data.researchArea,
          maxScholars: MAX_SCHOLARS_PER_SUPERVISOR,
        },
      });

      return tx.user.update({
        where: { id: userId },
        data: {
          role: Role.RESEARCH_SUPERVISOR,
          onboardingCompleted: true,
          status: UserStatus.ACTIVE,
          approved: true,
          employeeId: effectiveEmployeeId,
          departmentId: effectiveDepartmentId,
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
      supervisorId?: string;
    }
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    if (user.role && user.role !== Role.RESEARCH_SCHOLAR && user.role !== Role.INSTITUTE_ADMIN) {
      throw new BadRequestException('User already has a different role assigned.');
    }
    if (user.onboardingCompleted && user.supervisorId) {
      throw new BadRequestException('User has already completed onboarding and has a supervisor assigned.');
    }

    // Verify faculty and department
    const dept = await this.prisma.department.findUnique({
      where: { id: data.departmentId },
      include: { faculty: true }
    });
    if (!dept || dept.facultyId !== data.facultyId) {
      throw new BadRequestException('Invalid department/faculty selection.');
    }

    let supervisor: any = null;
    if (data.supervisorId) {
      // Verify supervisor exists and is active/not at capacity
      supervisor = await this.prisma.user.findUnique({
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
      const maxScholars = supervisor.supervisorProfile?.maxScholars ?? MAX_SCHOLARS_PER_SUPERVISOR;
      if (currentScholars >= maxScholars) {
        throw new BadRequestException(`Selected supervisor has reached maximum scholar capacity of ${maxScholars}.`);
      }
    }

    // Start transaction to create profile, update user, and create request
    return this.prisma.$transaction(async (tx) => {
      await tx.scholarProfile.upsert({
        where: { userId },
        create: {
          userId,
          facultyId: data.facultyId,
          departmentId: data.departmentId,
          researchArea: data.researchArea,
        },
        update: {
          facultyId: data.facultyId,
          departmentId: data.departmentId,
          researchArea: data.researchArea,
        }
      });

      if (data.supervisorId) {
        await tx.scholarSupervisorRequest.create({
          data: {
            scholarId: userId,
            supervisorId: data.supervisorId,
            status: RequestStatus.PENDING,
          },
        });
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          role: Role.RESEARCH_SCHOLAR,
          onboardingCompleted: true,
          status: data.supervisorId ? UserStatus.PENDING_SUPERVISOR_APPROVAL : UserStatus.ACTIVE,
          approved: !data.supervisorId,
          departmentId: data.departmentId,
          department: dept.name,
          faculty: dept.faculty.name,
        },
        include: {
          scholarProfile: true,
        },
      });

      // Trigger supervisor notification asynchronously if supervisor chosen
      if (data.supervisorId && supervisor) {
        try {
          await this.notifications.notifyScholarRegistrationSubmitted(userId, data.supervisorId);
        } catch (err) {
          console.error('Failed to notify supervisor on onboarding:', err);
        }

        const request = await tx.scholarSupervisorRequest.findFirst({
          where: { scholarId: userId, supervisorId: data.supervisorId, status: RequestStatus.PENDING },
        });
        if (request) {
          this.mailService.sendScholarSupervisionRequestAlert({
            supervisorEmail: supervisor.email,
            supervisorName: supervisor.name || 'Supervisor',
            scholarName: user.name || user.email,
            scholarEmail: user.email,
            department: dept.name,
            researchArea: data.researchArea,
            requestId: request.id,
            createdAt: request.createdAt,
          }).catch(() => {});
        }
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: data.supervisorId ? 'SCHOLAR_SUPERVISION_REQUEST_CREATED' : 'SCHOLAR_ONBOARDING_COMPLETED',
          details: JSON.stringify({ supervisorId: data.supervisorId || null, facultyId: data.facultyId, departmentId: data.departmentId }),
        }
      });

      return updatedUser;
    });
  }
}
