import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  async getPublishedAnnouncements() {
    return this.announcementsService.getPublishedAnnouncements();
  }

  @Get('admin')
  @UseGuards(ClerkAuthGuard)
  async getAnnouncementsForAdmin(@Req() req: any) {
    if (req.user.role !== 'INSTITUTE_ADMIN') {
      throw new BadRequestException('Only administrators can view all announcements.');
    }
    return this.announcementsService.getAnnouncements();
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  async createAnnouncement(@Body() body: any, @Req() req: any) {
    if (req.user.role !== 'INSTITUTE_ADMIN') {
      throw new BadRequestException('Only administrators can create announcements.');
    }
    return this.announcementsService.createAnnouncement({
      title: body.title,
      content: body.content,
      status: body.status || 'DRAFT',
      pushToEmail: !!body.pushToEmail,
      authorId: req.user.id,
    });
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  async updateAnnouncement(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.role !== 'INSTITUTE_ADMIN') {
      throw new BadRequestException('Only administrators can update announcements.');
    }
    return this.announcementsService.updateAnnouncement(id, body);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async deleteAnnouncement(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'INSTITUTE_ADMIN') {
      throw new BadRequestException('Only administrators can delete announcements.');
    }
    return this.announcementsService.deleteAnnouncement(id);
  }

  @Post(':id/publish')
  @UseGuards(ClerkAuthGuard)
  async publishAnnouncement(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'INSTITUTE_ADMIN') {
      throw new BadRequestException('Only administrators can publish announcements.');
    }
    return this.announcementsService.publishAnnouncement(id);
  }
}
