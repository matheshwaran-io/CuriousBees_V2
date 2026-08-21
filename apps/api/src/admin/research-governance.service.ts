import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminResearchGovernanceService {
  private readonly logger = new Logger(AdminResearchGovernanceService.name);

  constructor(private prisma: PrismaService) {}

  async getWorkspaces(query: { search?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, role: true, department: true },
              },
            },
          },
          _count: {
            select: {
              files: true,
              milestones: true,
              announcements: true,
            },
          },
        },
      }),
      this.prisma.workspace.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getResearchOverview() {
    const [
      totalWorkspaces,
      totalPublications,
      departments,
      supervisorsWithScholars,
      recentCollaborations,
    ] = await Promise.all([
      this.prisma.workspace.count(),
      this.prisma.publication.count({ where: { hidden: false } }),
      this.prisma.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          faculty: { select: { name: true } },
          _count: {
            select: {
              users: true,
              supervisorProfiles: true,
              scholarProfiles: true,
            },
          },
        },
      }),
      this.prisma.user.findMany({
        where: { role: 'RESEARCH_SUPERVISOR', status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          supervisorProfile: true,
          _count: {
            select: { scholars: true },
          },
        },
      }),
      this.prisma.researchCollaboration.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { id: true, name: true, role: true, department: true } },
          recipient: { select: { id: true, name: true, role: true, department: true } },
        },
      }),
    ]);

    return {
      totalWorkspaces,
      totalPublications,
      departments,
      supervisorsWithScholars,
      recentCollaborations,
    };
  }
}
