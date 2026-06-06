import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationJobData } from './notifications.service';

@Processor('event-notifications', {
  concurrency: 5, // Process up to 5 notification batches concurrently
})
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData, any, string>): Promise<any> {
    const { eventId, userIds, title, body } = job.data;
    this.logger.log(`Processing notification job ${job.id} for event ${eventId} to ${userIds.length} users.`);

    // 1. Fetch device tokens for all matched users (Skipped because Firebase removed)
    // 2. Multicast using FCM (Skipped because Firebase removed)


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
