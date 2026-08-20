import { Controller, Post, Get, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard, ApprovedGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}



  @Get()
  async getNotifications(@Req() req: any) {
    return this.notificationsService.getNotifications(req.user.id);
  }

  @Put('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Put(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    return await this.notificationsService.getPreferences(req.user.id);
  }

  @Put('preferences')
  async updatePreferences(@Req() req: any, @Body() body: any) {
    return await this.notificationsService.updatePreferences(req.user.id, body);
  }
}
