import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventStatus, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailParserService } from './services/email-parser.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private emailParserService: EmailParserService
  ) {}

  /**
   * Stages an inbound email into the temporary PendingEmailEvent table.
   * Only processes emails where Subject contains "Event Announcement" (case-insensitive).
   */
  async stageInboundEmail(body: string, senderEmail: string, subject?: string) {
    const rawSubject = subject ? subject.trim() : '';

    // Verify Subject line contains "Event Announcement"
    if (!rawSubject.toLowerCase().includes('event announcement')) {
      this.logger.warn(`Skipped inbound email from ${senderEmail} — Subject does not contain "Event Announcement". Subject: "${rawSubject}"`);
      return {
        success: false,
        ignored: true,
        message: 'Inbound email ignored: Subject line must contain "Event Announcement".'
      };
    }

    const parsed = this.emailParserService.parseEmail(body, senderEmail, subject);

    const pending = await this.prisma.pendingEmailEvent.create({
      data: {
        senderEmail: parsed.senderEmail,
        title: parsed.title,
        speaker: parsed.speaker,
        date: parsed.date,
        time: parsed.time,
        venue: parsed.venue,
        department: parsed.department,
        description: parsed.description,
      }
    });

    this.logger.log(`Staged pending email event ${pending.id} from ${parsed.senderEmail} (Subject matched "Event Announcement")`);
    return pending;
  }

  /**
   * Retrieves all pending staged email events for Institute Admin review.
   */
  async getPendingEmailEvents() {
    return this.prisma.pendingEmailEvent.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Approves a pending email event:
   * 1. Creates a published Event in the primary table.
   * 2. Deletes the temporary PendingEmailEvent entry.
   * 3. Dispatches notifications to interested scholars & faculty.
   */
  async approvePendingEmailEvent(id: string) {
    const pending = await this.prisma.pendingEmailEvent.findUnique({ where: { id } });
    if (!pending) {
      throw new NotFoundException('Pending email event not found.');
    }

    const publishedEvent = await this.prisma.event.create({
      data: {
        title: pending.title,
        eventType: 'Email Intake',
        speaker: pending.speaker,
        department: pending.department,
        date: pending.date,
        time: pending.time,
        venue: pending.venue,
        description: pending.description,
        organizerEmail: pending.senderEmail,
        status: EventStatus.PUBLISHED,
        priority: 'MEDIUM',
      }
    });

    // Delete from temporary table
    await this.prisma.pendingEmailEvent.delete({ where: { id } });
    this.logger.log(`Approved & published pending email event ${id} -> Event ${publishedEvent.id}`);

    // Route notifications to subscribers
    this.notificationsService.routeEvent(publishedEvent).catch(e => {
      this.logger.error(`Failed to route notifications for event ${publishedEvent.id}: ${e.message}`);
    });

    return { success: true, event: publishedEvent };
  }

  /**
   * Rejects and discards a pending email event.
   */
  async rejectPendingEmailEvent(id: string) {
    const pending = await this.prisma.pendingEmailEvent.findUnique({ where: { id } });
    if (!pending) {
      throw new NotFoundException('Pending email event not found.');
    }

    await this.prisma.pendingEmailEvent.delete({ where: { id } });
    this.logger.log(`Rejected & deleted pending email event ${id}`);

    return { success: true };
  }

  /**
   * Retrieves events with optional filtering and pagination.
   */
  async getEvents(filters?: { status?: EventStatus; limit?: number; skip?: number }) {
    try {
      const where: Prisma.EventWhereInput = {};
      if (filters?.status) {
        where.status = filters.status;
      } else {
        // By default, don't return FAILED events in the main calendar
        where.status = { not: EventStatus.FAILED };
      }

      return await this.prisma.event.findMany({
        where,
        orderBy: { date: 'asc' },
        take: filters?.limit || 100,
        skip: filters?.skip || 0,
      });
    } catch (e: any) {
      this.logger.error('Failed to query database events', e);
      return [];
    }
  }

  /**
   * Specifically returns events requiring human review.
   */
  async getReviewEvents() {
    return this.getEvents({ status: EventStatus.REVIEW_REQUIRED });
  }

  /**
   * Retrieves a single event by ID.
   */
  async getEventById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found.');
    return event;
  }

  /**
   * Creates an event manually (skipping AI).
   */
  async createEvent(input: { title: string; date: string; time: string; venue: string; description?: string }) {
    const { title, date, time, venue, description } = input;
    if (!title || !date || !time || !venue) {
      throw new BadRequestException('Event details are incomplete.');
    }

    try {
      return await this.prisma.event.create({
        data: { 
          title, 
          date: new Date(date), 
          time, 
          venue, 
          description,
          eventType: 'Manual Entry',
          status: EventStatus.PUBLISHED
        }
      });
    } catch (e) {
      this.logger.error('Failed to create event', e);
      throw new BadRequestException('Could not create event');
    }
  }

  /**
   * Updates full event details.
   */
  async updateEvent(id: string, input: Prisma.EventUpdateInput) {
    try {
      return await this.prisma.event.update({
        where: { id },
        data: input
      });
    } catch (e) {
      throw new NotFoundException('Event not found.');
    }
  }

  /**
   * Patches only the status of an event (for AI review queue).
   */
  async updateEventStatus(id: string, status: EventStatus) {
    try {
      const updatedEvent = await this.prisma.event.update({
        where: { id },
        data: { status }
      });

      // If approved, route it to interested users
      if (status === EventStatus.PUBLISHED) {
        // We do this async without awaiting so it doesn't block the HTTP response
        this.notificationsService.routeEvent(updatedEvent).catch(e => {
          this.logger.error(`Failed to route published event ${id}: ${e.message}`);
        });
      }

      return updatedEvent;
    } catch (e) {
      throw new NotFoundException('Event not found.');
    }
  }

  /**
   * Deletes an event.
   */
  async deleteEvent(id: string) {
    try {
      return await this.prisma.event.delete({
        where: { id }
      });
    } catch (e) {
      throw new NotFoundException('Event not found.');
    }
  }


}
