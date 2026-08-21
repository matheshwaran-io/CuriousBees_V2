import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { AdminAuditService } from './audit.service';

@Controller('admin/audit')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Role.INSTITUTE_ADMIN)
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get('logs')
  async getAuditLogs(@Query() query: any) {
    return this.auditService.getAuditLogs(query);
  }

  @Get('security-events')
  async getSecurityEvents(@Query() query: any) {
    return this.auditService.getSecurityEvents(query);
  }
}
