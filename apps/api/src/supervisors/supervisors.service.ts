import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, RequestStatus } from '@prisma/client';

@Injectable()
export class SupervisorsService {
  private readonly logger = new Logger(SupervisorsService.name);

  constructor(private prisma: PrismaService) {}

  async getSupervisors(departmentId?: string, facultyId?: string, search?: string) {
    const supervisors = await this.prisma.user.findMany({
      where: {
        role: 'RESEARCH_SUPERVISOR',
        status: 'ACTIVE',
        ...(departmentId || facultyId ? {
          supervisorProfile: {
            ...(departmentId && { departmentId }),
            ...(facultyId && { facultyId }),
          }
        } : {}),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { department: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        supervisorProfile: true,
        _count: {
          select: {
            scholars: {
              where: {
                role: 'RESEARCH_SCHOLAR',
                status: 'ACTIVE',
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    return supervisors.map(sup => {
      const currentScholars = sup._count.scholars;
      const maxScholars = sup.supervisorProfile?.maxScholars ?? 5;
      return {
        id: sup.id,
        name: sup.name,
        email: sup.email,
        image: sup.image,
        department: sup.department,
        faculty: sup.faculty,
        designation: sup.supervisorProfile?.designation || 'Faculty',
        currentScholars,
        maxScholars,
        isAtCapacity: currentScholars >= maxScholars,
      };
    });
  }

  async getPendingScholars(supervisorId: string) {
    const requests = await this.prisma.scholarSupervisorRequest.findMany({
      where: {
        supervisorId,
        status: 'PENDING',
      },
      include: {
        scholar: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            department: true,
            scholarProfile: true,
            createdAt: true,
          }
        }
      }
    });

    return requests.map(req => ({
      requestId: req.id,
      id: req.scholar.id,
      name: req.scholar.name,
      email: req.scholar.email,
      department: req.scholar.department,
      image: req.scholar.image,
      researchArea: req.scholar.scholarProfile?.researchArea || 'N/A',
      createdAt: req.createdAt,
    }));
  }

  async approveScholar(supervisorId: string, requestId: string) {
    const request = await this.prisma.scholarSupervisorRequest.findUnique({
      where: { id: requestId },
      include: { scholar: true }
    });

    if (!request || request.supervisorId !== supervisorId) {
      throw new BadRequestException('Pending scholar request not found.');
    }

    const supervisor = await this.prisma.user.findUnique({
      where: { id: supervisorId }
    });

    // 1. Update the request status
    await this.prisma.scholarSupervisorRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    // 2. Update scholar status to ACTIVE and approved = true, and link supervisorId
    return this.prisma.user.update({
      where: { id: request.scholarId },
      data: {
        status: 'ACTIVE',
        approved: true,
        supervisorId,
        supervisorEmail: supervisor?.email || null,
      },
    });
  }

  async rejectScholar(supervisorId: string, requestId: string) {
    const request = await this.prisma.scholarSupervisorRequest.findUnique({
      where: { id: requestId },
      include: { scholar: true }
    });

    if (!request || request.supervisorId !== supervisorId) {
      throw new BadRequestException('Pending scholar request not found.');
    }

    // 1. Update request status
    await this.prisma.scholarSupervisorRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    // 2. Update scholar status to REJECTED and approved = false
    return this.prisma.user.update({
      where: { id: request.scholarId },
      data: {
        status: 'REJECTED',
        approved: false,
      },
    });
  }
}
