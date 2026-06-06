import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Event as PrismaEvent } from '@prisma/client';
import * as admin from 'firebase-admin';

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
    @InjectQueue('event-notifications') private notificationQueue: Queue
  ) {}

  /**
   * Registers a unique FCM token to a User
   */
  async registerToken(userId: string, token: string) {
    if (!token) {
      throw new BadRequestException('FCM registration token is required.');
    }

    try {
      return await this.prisma.notificationToken.upsert({
        where: { token },
        update: { userId },
        create: { token, userId }
      });
    } catch (e: any) {
      this.logger.error(`❌ Failed to register FCM token: ${e.message}`);
      throw new BadRequestException('Failed to save device registration token.');
    }
  }

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
   * Dispatches a push notification directly to a user's registered devices.
   * Used for low-volume, targeted pushes (e.g. comment alerts).
   */
  async sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    try {
      const devices = await this.prisma.notificationToken.findMany({ where: { userId } });
      if (devices.length === 0) {
        this.logger.log(`User ${userId} has no registered devices. Skipping push.`);
        return;
      }
      const tokens = devices.map(d => d.token);
      const message: any = {
        tokens,
        notification: { title: payload.title, body: payload.body },
        data: payload.url ? { url: payload.url } : {},
        webpush: { notification: { icon: '/logo.png', click_action: payload.url || '/' } }
      };
      const response = await admin.messaging().sendMulticast(message);
      this.logger.log(`[FCM] Notification Sent: ${response.successCount} succeeded, ${response.failureCount} failed.`);
      // Cleanup expired tokens
      const expiredTokens: string[] = [];
      response.responses.forEach((res: any, idx: number) => {
        if (!res.success && res.error) {
          const code = res.error.code;
          if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
            expiredTokens.push(tokens[idx]);
          }
        }
      });
      if (expiredTokens.length > 0) {
        await this.prisma.notificationToken.deleteMany({ where: { token: { in: expiredTokens } } });
      }
    } catch (e: any) {
      this.logger.error(`sendPushToUser failed: ${e.message}`);
    }
  }

  /**
   * Generic method to send notification using Firebase Admin SDK
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
          where: { role: 'INSTITUTION_ADMIN' }
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

    // Push to Queue for Async Delivery
    await this.notificationQueue.add('send-event-push', {
      eventId: event.id,
      userIds: recipients,
      title,
      body,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }, // Exponential backoff for network transient errors
      removeOnComplete: true,
      removeOnFail: false
    });
  }
}
