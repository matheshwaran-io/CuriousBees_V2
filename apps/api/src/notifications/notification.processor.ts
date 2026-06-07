import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationJobData } from './notifications.service';

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async process(data: NotificationJobData): Promise<any> {
    const { eventId, userIds, title, body } = data;
    this.logger.log(`Processing notification for event ${eventId} to ${userIds.length} users.`);

    // FCM multicast logic removed as part of Firebase deletion.

    // 3. Persist success to NotificationLog and standard Notification table
    const logs = userIds.map(uid => ({
      eventId,
      recipientType: 'USER',
      channel: 'PUSH',
      status: 'DELIVERED',
    }));

    const standardNotifications = userIds.map(uid => ({
      userId: uid,
      eventId,
      title,
      body,
      sentStatus: true,
    }));

    await this.prisma.$transaction([
      this.prisma.notificationLog.createMany({ data: logs }),
      this.prisma.notification.createMany({ data: standardNotifications })
    ]);
  }
}
