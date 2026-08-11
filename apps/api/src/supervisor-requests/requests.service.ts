import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus, UserStatus, Role } from '@prisma/client';
import { MailService } from '../users/mail.service';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

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

    if (!supervisor || supervisor.role !== Role.RESEARCH_SUPERVISOR) {
      throw new BadRequestException('Selected user is not a valid Research Supervisor.');
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

    const req = await this.prisma.$transaction(async (tx) => {
      // Create request
      const createdReq = await tx.scholarSupervisorRequest.create({
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

      return createdReq;
    });

    // Asynchronously trigger Resend Email Notification
    this.mailService.sendScholarSupervisionRequestAlert({
      supervisorEmail: supervisor.email,
      supervisorName: supervisor.name || 'Supervisor',
      scholarName: scholar.name || scholar.email,
      scholarEmail: scholar.email,
      department: scholar.department || 'SRMIST',
      researchArea: scholar.scholarProfile?.researchArea || '',
      requestId: req.id,
      createdAt: req.createdAt,
    }).catch(() => {});

    // Audit Logging
    await this.prisma.auditLog.create({
      data: {
        userId: scholarId,
        action: 'SCHOLAR_SUPERVISION_REQUEST_CREATED',
        details: JSON.stringify({ requestId: req.id, supervisorId }),
      }
    }).catch(() => {});

    return req;
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

  async getRequestById(userId: string, role: Role, requestId: string) {
    const request = await this.prisma.scholarSupervisorRequest.findUnique({
      where: { id: requestId },
      include: {
        scholar: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            image: true,
            bio: true,
            scholarProfile: true,
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            image: true,
            supervisorProfile: true,
          }
        }
      }
    });

    if (!request) {
      throw new NotFoundException('Request not found.');
    }

    // Security Check: User must be the scholar, supervisor, or Institute Admin
    if (role !== Role.INSTITUTE_ADMIN && request.scholarId !== userId && request.supervisorId !== userId) {
      throw new ForbiddenException('You are not authorized to view this request.');
    }

    return request;
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

    const updatedReq = await this.prisma.$transaction(async (tx) => {
      // 1. Update request status
      const req = await tx.scholarSupervisorRequest.update({
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

      return req;
    });

    // Trigger Email Notification
    if (request.scholar?.email) {
      this.mailService.sendScholarSupervisionApprovedAlert({
        scholarEmail: request.scholar.email,
        scholarName: request.scholar.name || request.scholar.email,
        supervisorName: supervisor?.name || 'Your Research Supervisor',
        department: supervisor?.department || 'SRMIST',
      }).catch(() => {});
    }

    // Audit Logging
    await this.prisma.auditLog.create({
      data: {
        userId: supervisorId,
        action: 'SUPERVISION_REQUEST_APPROVED',
        details: JSON.stringify({ requestId, scholarId: request.scholarId }),
      }
    }).catch(() => {});

    return updatedReq;
  }

  async rejectRequest(supervisorId: string, requestId: string) {
    const request = await this.prisma.scholarSupervisorRequest.findUnique({
      where: { id: requestId },
      include: { scholar: true }
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

    const supervisor = await this.prisma.user.findUnique({
      where: { id: supervisorId }
    });

    const updatedReq = await this.prisma.$transaction(async (tx) => {
      // 1. Update request status
      const req = await tx.scholarSupervisorRequest.update({
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

      return req;
    });

    // Trigger Email Notification
    if (request.scholar?.email) {
      this.mailService.sendScholarSupervisionRejectedAlert({
        scholarEmail: request.scholar.email,
        scholarName: request.scholar.name || request.scholar.email,
        supervisorName: supervisor?.name || 'Research Supervisor',
      }).catch(() => {});
    }

    // Audit Logging
    await this.prisma.auditLog.create({
      data: {
        userId: supervisorId,
        action: 'SUPERVISION_REQUEST_REJECTED',
        details: JSON.stringify({ requestId, scholarId: request.scholarId }),
      }
    }).catch(() => {});

    return updatedReq;
  }

  async cancelRequest(scholarId: string, requestId: string) {
    const request = await this.prisma.scholarSupervisorRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new NotFoundException('Request not found.');
    }

    if (request.scholarId !== scholarId) {
      throw new ForbiddenException('You are not authorized to cancel this request.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled.');
    }

    const updatedReq = await this.prisma.$transaction(async (tx) => {
      const req = await tx.scholarSupervisorRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.REJECTED },
      });

      await tx.user.update({
        where: { id: scholarId },
        data: {
          status: UserStatus.REJECTED,
          approved: false,
        },
      });

      return req;
    });

    // Audit Logging
    await this.prisma.auditLog.create({
      data: {
        userId: scholarId,
        action: 'SUPERVISION_REQUEST_CANCELLED',
        details: JSON.stringify({ requestId }),
      }
    }).catch(() => {});

    return updatedReq;
  }
}
