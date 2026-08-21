import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { AdminModerationService } from './moderation.service';

@Controller('admin/moderation')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Role.INSTITUTE_ADMIN)
export class AdminModerationController {
  constructor(private readonly moderationService: AdminModerationService) {}

  @Get('reports')
  async getReports(@Query() query: any) {
    return this.moderationService.getReports(query);
  }

  @Post('reports/:id/resolve')
  async resolveReport(
    @Param('id') id: string,
    @Body('resolutionNote') resolutionNote: string,
    @Req() req: any
  ) {
    if (!resolutionNote) throw new BadRequestException('Resolution note is required');
    return this.moderationService.resolveReport(req.user, id, resolutionNote);
  }

  @Post('reports/:id/dismiss')
  async dismissReport(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any
  ) {
    if (!reason) throw new BadRequestException('Dismissal reason is required');
    return this.moderationService.dismissReport(req.user, id, reason);
  }
}
