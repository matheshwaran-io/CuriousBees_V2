import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { AdminAnalyticsService } from './analytics.service';

@Controller('admin/analytics')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Role.INSTITUTE_ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get()
  async getAnalytics(@Query('range') range?: string) {
    return this.analyticsService.getAnalytics(range || '30D');
  }
}
