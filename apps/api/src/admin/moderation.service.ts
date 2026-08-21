import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditHelperService } from './audit-helper';

@Injectable()
export class AdminModerationService {
  private readonly logger = new Logger(AdminModerationService.name);

  constructor(
    private prisma: PrismaService,
    private auditHelper: AuditHelperService,
  ) {}

  async getReports(query: {
    status?: string;
    targetType?: string;
    severity?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.targetType && query.targetType !== 'ALL') {
      where.targetType = query.targetType;
    }

    if (query.severity && query.severity !== 'ALL') {
      where.severity = query.severity;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { reason: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.moderationReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, name: true, email: true, role: true, department: true },
          },
        },
      }),
      this.prisma.moderationReport.count({ where }),
    ]);

    // Enhance reports with target preview info if available
    const enhancedItems = await Promise.all(
      items.map(async (rep) => {
        let targetPreview: any = null;
        try {
          if (rep.targetType === 'POST' || rep.targetType === 'THREAD') {
            targetPreview = await this.prisma.thread.findUnique({
              where: { id: rep.targetId },
              select: { id: true, title: true, author: { select: { name: true, email: true } }, hidden: true },
            });
          } else if (rep.targetType === 'PUBLICATION') {
            targetPreview = await this.prisma.publication.findUnique({
              where: { id: rep.targetId },
              select: { id: true, title: true, authors: true, hidden: true },
            });
          } else if (rep.targetType === 'USER') {
            targetPreview = await this.prisma.user.findUnique({
              where: { id: rep.targetId },
              select: { id: true, name: true, email: true, status: true },
            });
          }
        } catch (e) {
          // Ignore preview lookup failure
        }
        return {
          ...rep,
          targetPreview,
        };
      })
    );

    return {
      items: enhancedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async resolveReport(actor: any, reportId: string, resolutionNote: string) {
    if (!resolutionNote || !resolutionNote.trim()) {
      throw new BadRequestException('Resolution note is required.');
    }

    const report = await this.prisma.moderationReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found.');

    const updated = await this.prisma.moderationReport.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED',
        resolvedById: actor.id,
        resolutionNote,
        resolvedAt: new Date(),
      },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REPORT_RESOLVED',
      targetId: report.id,
      targetType: 'REPORT',
      category: 'MODERATION',
      severity: 'MEDIUM',
      details: `Moderation report on ${report.targetType} ${report.targetId} resolved. Note: ${resolutionNote}`,
      previousState: { status: report.status },
      newState: { status: 'RESOLVED', resolutionNote },
      metadata: { reportId, targetType: report.targetType, targetId: report.targetId, resolutionNote },
    });

    return updated;
  }

  async dismissReport(actor: any, reportId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Dismissal reason is required.');
    }

    const report = await this.prisma.moderationReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found.');

    const updated = await this.prisma.moderationReport.update({
      where: { id: reportId },
      data: {
        status: 'DISMISSED',
        resolvedById: actor.id,
        resolutionNote: reason,
        resolvedAt: new Date(),
      },
    });

    await this.auditHelper.log({
      actorId: actor.id,
      actorEmail: actor.email,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REPORT_DISMISSED',
      targetId: report.id,
      targetType: 'REPORT',
      category: 'MODERATION',
      severity: 'LOW',
      details: `Moderation report on ${report.targetType} ${report.targetId} dismissed. Reason: ${reason}`,
      previousState: { status: report.status },
      newState: { status: 'DISMISSED', reason },
      metadata: { reportId, targetType: report.targetType, targetId: report.targetId, reason },
    });

    return updated;
  }

  async fileReport(reporterId: string, data: {
    targetType: string;
    targetId: string;
    reason: string;
    description?: string;
    severity?: string;
  }) {
    return this.prisma.moderationReport.create({
      data: {
        reporterId,
        targetType: data.targetType.toUpperCase(),
        targetId: data.targetId,
        reason: data.reason,
        description: data.description || null,
        severity: data.severity || 'MEDIUM',
        status: 'OPEN',
      },
    });
  }
}
