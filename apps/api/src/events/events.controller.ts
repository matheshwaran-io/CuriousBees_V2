import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { ApprovedGuard } from '../auth/approved.guard';
import { Public } from '../auth/public.decorator';
import { InboundEmailDto } from './dto/inbound-email.dto';
import { EventStatus, Prisma } from '@prisma/client';

@Controller('events')
@UseGuards(ClerkAuthGuard, ApprovedGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService
  ) {}

  @Get()
  async getEvents(
    @Query('status') status?: EventStatus,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string
  ) {
    return this.eventsService.getEvents({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
    });
  }

  @Get('review')
  async getReviewEvents() {
    return this.eventsService.getReviewEvents();
  }
  @Public()
  @Post('inbound-email')
  async handleInboundEmailDirect(@Body() body: any) {
    // Resend wraps inbound email payloads in body.data
    const emailData = body.data || body;
    const emailBody = emailData.text || emailData.body || emailData.html || '';
    
    // Extract sender email address (handle string or object formats like { email: '...' })
    let senderEmail = 'events@akbattery.in';
    if (typeof emailData.from === 'string') {
      senderEmail = emailData.from;
    } else if (emailData.from && emailData.from.email) {
      senderEmail = emailData.from.email;
    } else if (typeof emailData.sender === 'string') {
      senderEmail = emailData.sender;
    }

    const subject = emailData.subject || '';

    return this.eventsService.stageInboundEmail(emailBody, senderEmail, subject);
  }

  @Get('pending-emails')
  async getPendingEmailEvents() {
    return this.eventsService.getPendingEmailEvents();
  }

  @Post('pending-emails/:id/approve')
  async approvePendingEmailEvent(@Param('id') id: string) {
    return this.eventsService.approvePendingEmailEvent(id);
  }

  @Delete('pending-emails/:id/reject')
  async rejectPendingEmailEvent(@Param('id') id: string) {
    return this.eventsService.rejectPendingEmailEvent(id);
  }

  @Post()
  async createEvent(
    @Body() body: { title: string; date: string; time: string; venue: string; description?: string }
  ) {
    return this.eventsService.createEvent(body);
  }

  @Put(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() body: Prisma.EventUpdateInput
  ) {
    return this.eventsService.updateEvent(id, body);
  }

  @Patch(':id/status')
  async updateEventStatus(
    @Param('id') id: string,
    @Body() body: { status: EventStatus }
  ) {
    return this.eventsService.updateEventStatus(id, body.status);
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: string) {
    return this.eventsService.deleteEvent(id);
  }
}

// Public Inbound Email Webhook Controller — No auth required
@Controller('events/inbound-email')
export class EventsPublicController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async handleInboundEmail(@Body() body: any) {
    const emailBody = body.text || body.body || body.html || body.plain || '';
    const senderEmail = body.sender || body.from || body['envelope']?.from || 'organizer@srmist.edu.in';
    const subject = body.subject || '';

    return this.eventsService.stageInboundEmail(emailBody, senderEmail, subject);
  }
}
