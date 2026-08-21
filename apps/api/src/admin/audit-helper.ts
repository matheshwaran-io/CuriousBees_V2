import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogParams {
  actorId?: string;
  actorEmail?: string;
  actorName?: string;
  actorRole?: string;
  action: string;
  targetId?: string;
  targetType?: string;
  category?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details?: string;
  previousState?: any;
  newState?: any;
  metadata?: any;
  status?: 'SUCCESS' | 'FAILED';
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditHelperService {
  private readonly logger = new Logger(AuditHelperService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          actorEmail: params.actorEmail || null,
          actorName: params.actorName || null,
          actorRole: params.actorRole || null,
          userId: params.actorId || null, // backward compatibility
          action: params.action,
          targetId: params.targetId || null,
          targetType: params.targetType || null,
          category: params.category || 'GOVERNANCE',
          severity: params.severity || 'LOW',
          details: params.details || null,
          previousState: params.previousState ? params.previousState : undefined,
          newState: params.newState ? params.newState : undefined,
          metadata: params.metadata ? params.metadata : undefined,
          status: params.status || 'SUCCESS',
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to write immutable audit log: ${err.message}`, err.stack);
      // We do not throw here so business operations aren't crashed by logging errors,
      // but the failure is logged to server output.
      return null;
    }
  }
}
