import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAuditService {
  private readonly logger = new Logger(AdminAuditService.name);

  constructor(private prisma: PrismaService) {}

  async getAuditLogs(query: {
    actor?: string;
    action?: string;
    role?: string;
    category?: string;
    severity?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 25;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.action && query.action !== 'ALL') {
      where.action = query.action;
    }

    if (query.category && query.category !== 'ALL') {
      where.category = query.category;
    }

    if (query.severity && query.severity !== 'ALL') {
      where.severity = query.severity;
    }

    if (query.role && query.role !== 'ALL') {
      where.actorRole = query.role;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { actorEmail: { contains: s, mode: 'insensitive' } },
        { actorName: { contains: s, mode: 'insensitive' } },
        { action: { contains: s, mode: 'insensitive' } },
        { details: { contains: s, mode: 'insensitive' } },
        { targetId: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
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

  async getSecurityEvents(query: {
    severity?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [
        { category: 'SECURITY' },
        { severity: 'CRITICAL' },
        { severity: 'HIGH' },
      ],
    };

    if (query.severity && query.severity !== 'ALL') {
      where.severity = query.severity;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.AND = [
        {
          OR: [
            { action: { contains: s, mode: 'insensitive' } },
            { details: { contains: s, mode: 'insensitive' } },
            { actorEmail: { contains: s, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
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
}
