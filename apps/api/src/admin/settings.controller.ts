import { Controller, Get, Put, Body, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { AdminSettingsService } from './settings.service';

@Controller('admin/settings')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(Role.INSTITUTE_ADMIN)
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Put(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body('value') value: any,
    @Body('category') category: string,
    @Req() req: any
  ) {
    if (value === undefined) throw new BadRequestException('Value is required');
    return this.settingsService.updateSetting(req.user, key, value, category);
  }

  @Get('email-delivery')
  async getEmailDelivery() {
    return this.settingsService.getEmailDeliveryStats();
  }
}
