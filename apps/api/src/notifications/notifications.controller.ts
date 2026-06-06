import { Controller, Post, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(ClerkAuthGuard, ApprovedGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}



  @Get()
  async getNotifications(@Req() req: any) {
    return this.notificationsService.getNotifications(req.user.id);
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
