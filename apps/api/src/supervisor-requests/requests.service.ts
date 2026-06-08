import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, UserStatus, Role } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async createRequest(scholarId: string, supervisorId: string) {
    const scholar = await this.prisma.user.findUnique({
      where: { id: scholarId },
      include: { scholarProfile: true }
    });

    if (!scholar || scholar.role !== Role.RESEARCH_SCHOLAR) {
      throw new BadRequestException('Only Research Scholars can create requests.');
    }

    if (!scholar.scholarProfile) {
      throw new BadRequestException('Please complete onboarding first.');
    }

    // Verify supervisor
    const supervisor = await this.prisma.user.findUnique({
      where: { id: supervisorId },
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

    // Check for existing pending request
    const existing = await this.prisma.scholarSupervisorRequest.findFirst({
      where: {
        scholarId,
        status: RequestStatus.PENDING,
      }
    });
    if (existing) {
      throw new BadRequestException('You already have a pending supervisor request.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create request
      const req = await tx.scholarSupervisorRequest.create({
        data: {
          scholarId,
          supervisorId,
          status: RequestStatus.PENDING,
        }
      });

      // Set scholar status
      await tx.user.update({
        where: { id: scholarId },
        data: {
          status: UserStatus.PENDING_SUPERVISOR_APPROVAL,
          approved: false,
        }
      });

      return req;
    });
  }

  async getRequests(userId: string, role: Role) {
    if (role === Role.INSTITUTE_ADMIN) {
      return this.prisma.scholarSupervisorRequest.findMany({
        include: {
          scholar: {
            select: { id: true, name: true, email: true, department: true }
          },
          supervisor: {
            select: { id: true, name: true, email: true, department: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === Role.RESEARCH_SUPERVISOR) {
      return this.prisma.scholarSupervisorRequest.findMany({
        where: { supervisorId: userId },
        include: {
          scholar: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              image: true,
              scholarProfile: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (role === Role.RESEARCH_SCHOLAR) {
      return this.prisma.scholarSupervisorRequest.findMany({
        where: { scholarId: userId },
        include: {
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              image: true,
              supervisorProfile: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException('Invalid role context.');
  }

  async approveRequest(supervisorId: string, requestId: string) {
    const request = await this.prisma.scholarSupervisorRequest.findUnique({
      where: { id: requestId },
      include: { scholar: true }
    });

    if (!request) {
      throw new NotFoundException('Request not found.');
    }

    if (request.supervisorId !== supervisorId) {
      throw new ForbiddenException('You are not authorized to approve this request.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request is already processed.');
    }

    const supervisor = await this.prisma.user.findUnique({
      where: { id: supervisorId }
    });

    return this.prisma.$transaction(async (tx) => {
      // 1. Update request status
      const updatedReq = await tx.scholarSupervisorRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.APPROVED },
      });

      // 2. Update user status to ACTIVE, approved = true, link supervisorId
      await tx.user.update({
        where: { id: request.scholarId },
        data: {
          status: UserStatus.ACTIVE,
          approved: true,
          supervisorId,
          supervisorEmail: supervisor?.email || null,
        },
      });

      return updatedReq;
    });
  }

  async rejectRequest(supervisorId: string, requestId: string) {
    const request = await this.prisma.scholarSupervisorRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new NotFoundException('Request not found.');
    }

    if (request.supervisorId !== supervisorId) {
      throw new ForbiddenException('You are not authorized to reject this request.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request is already processed.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update request status
      const updatedReq = await tx.scholarSupervisorRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.REJECTED },
      });

      // 2. Update user status to REJECTED and approved = false
      await tx.user.update({
        where: { id: request.scholarId },
        data: {
          status: UserStatus.REJECTED,
          approved: false,
        },
      });

      return updatedReq;
    });
  }
}
