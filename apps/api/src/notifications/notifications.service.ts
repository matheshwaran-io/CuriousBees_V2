import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Event as PrismaEvent } from '@prisma/client';
import { NotificationProcessor } from './notification.processor';

export interface NotificationJobData {
  eventId: string;
  userIds: string[];
  title: string;
  body: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private readonly notificationProcessor: NotificationProcessor,
  ) {}



  /**
   * Retrieves log of notifications dispatched to a user
   */
  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  /**
   * Fetch User Preferences
   */
  async getPreferences(userId: string) {
    return await this.prisma.userPreference.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });
  }

  /**
   * Update User Preferences
   */
  async updatePreferences(userId: string, data: any) {
    return await this.prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data }
    });
  }

  /**
   * Push notification logic has been disabled and removed.
   * In the future, this can be implemented using OneSignal, WebPush, etc.
   */
  async sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    this.logger.log(`Skipping push to user ${userId} (Push provider removed). payload: ${payload.title}`);
  }

  /**
   * Generic method to create an in-app notification
   */
  async sendNotification(title: string, body: string, userId: string) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title,
          body,
          sentStatus: true,
        }
      });
    } catch (e: any) {
      this.logger.error(`Failed to save notification to database: ${e.message}`);
    }
    return this.sendPushToUser(userId, { title, body });
  }

  // --- Notification Hooks for Auth and Approval Workflows ---

  async notifyScholarRegistrationSubmitted(scholarId: string, supervisorId: string) {
    try {
      const scholar = await this.prisma.user.findUnique({ where: { id: scholarId } });
      if (scholar) {
        await this.sendNotification(
          'Scholar Registration Submitted',
          `${scholar.name || scholar.email} has requested you as their supervisor.`,
          supervisorId
        );
      }
    } catch (e: any) {
      this.logger.error(`notifyScholarRegistrationSubmitted failed: ${e.message}`);
    }
  }

  async notifyScholarApproved(scholarId: string, supervisorId: string) {
    try {
      const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
      await this.sendNotification(
        'Scholar Approved',
        `Your supervisor ${supervisor?.name || supervisor?.email || 'Faculty'} has approved your portal access.`,
        scholarId
      );
    } catch (e: any) {
      this.logger.error(`notifyScholarApproved failed: ${e.message}`);
    }
  }

  async notifyScholarRejected(scholarId: string, supervisorId: string) {
    try {
      const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
      await this.sendNotification(
        'Scholar Rejected',
        `Your supervisor request to ${supervisor?.name || supervisor?.email || 'Faculty'} was declined.`,
        scholarId
      );
    } catch (e: any) {
      this.logger.error(`notifyScholarRejected failed: ${e.message}`);
    }
  }

  async notifySupervisorRegistrationSubmitted(supervisorId: string) {
    try {
      const supervisor = await this.prisma.user.findUnique({ where: { id: supervisorId } });
      if (supervisor) {
        const admins = await this.prisma.user.findMany({
          where: { role: 'INSTITUTE_ADMIN' }
        });
        for (const admin of admins) {
          await this.sendNotification(
            'Supervisor Registration Submitted',
            `Faculty ${supervisor.name || supervisor.email} has registered and awaits approval.`,
            admin.id
          );
        }
      }
    } catch (e: any) {
      this.logger.error(`notifySupervisorRegistrationSubmitted failed: ${e.message}`);
    }
  }

  async notifySupervisorApproved(supervisorId: string, adminId: string) {
    try {
      await this.sendNotification(
        'Supervisor Approved',
        `Institutional Admin has approved your supervisor access.`,
        supervisorId
      );
    } catch (e: any) {
      this.logger.error(`notifySupervisorApproved failed: ${e.message}`);
    }
  }

  async notifySupervisorRejected(supervisorId: string, adminId: string) {
    try {
      await this.sendNotification(
        'Supervisor Rejected',
        `Your registration request as a supervisor was rejected.`,
        supervisorId
      );
    } catch (e: any) {
      this.logger.error(`notifySupervisorRejected failed: ${e.message}`);
    }
  }

  async notifyNewOpportunity(opportunityId: string, authorId: string) {
    // TODO: Implement later
  }

  async notifyNewThreadComment(threadId: string, authorId: string, commentId: string) {
    // TODO: Implement later
  }

  async notifyWorkspaceInvite(workspaceId: string, inviterId: string, inviteeId: string) {
    // TODO: Implement later
  }

  /**
   * The Smart Routing Engine: Determines who should receive a notification for an event,
   * then pushes the job to BullMQ for async delivery.
   */
  async routeEvent(event: PrismaEvent) {
    this.logger.log(`Routing newly published event: ${event.title}`);

    // Fetch all users with their preferences
    const preferences = await this.prisma.userPreference.findMany({
      where: { notificationsEnabled: true },
      include: { user: true }
    });

    // Match users
    const matchedUserIds = new Set<string>();

    for (const pref of preferences) {
      // 1. Department match
      const departmentMatch = pref.department === event.department;
      
      // 2. Tag match (if event shares any tags with user preferences)
      const tagMatch = event.tags.some(tag => pref.tags.includes(tag));
      
      // 3. Event Type match
      const typeMatch = pref.eventType === event.eventType;

      // 4. Default broad delivery for CRITICAL and HIGH priority events to their department
      const priorityMatch = 
        (event.priority === 'CRITICAL') || 
        (event.priority === 'HIGH' && pref.user.department === event.department);

      if (departmentMatch || tagMatch || typeMatch || priorityMatch) {
        matchedUserIds.add(pref.userId);
      }
    }

    const recipients = Array.from(matchedUserIds);
    if (recipients.length === 0) {
      this.logger.log(`No matching recipients found for event ${event.id}`);
      return;
    }

    this.logger.log(`Smart routing engine matched ${recipients.length} users for event ${event.id}`);

    // Create Notification Template
    const title = `📅 New Event: ${event.eventType}`;
    const body = `${event.title} is happening at ${event.venue} on ${new Date(event.date).toLocaleDateString()}`;

    // Process notification delivery asynchronously in-memory (no Redis queue required)
    this.notificationProcessor.process({
      eventId: event.id,
      userIds: recipients,
      title,
      body,
    }).catch((err: any) => {
      this.logger.error(`Failed to process event notifications: ${err.message}`);
    });
  }
}
