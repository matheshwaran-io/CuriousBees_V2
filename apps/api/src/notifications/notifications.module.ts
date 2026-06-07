import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { InterestMatcherService } from './interest-matcher.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationProcessor } from './notification.processor';
import { DigestScheduler } from './digest.scheduler';

const isRedisAvailable = process.env.REDIS_AVAILABLE !== 'false';

@Module({
  imports: [
    AuthModule,
    ScheduleModule.forRoot(),
    ...(isRedisAvailable
      ? [
          BullModule.registerQueue({
            name: 'event-notifications',
          }),
        ]
      : []),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    InterestMatcherService,
    DigestScheduler,
    ...(isRedisAvailable
      ? [
          NotificationProcessor,
        ]
      : [
          {
            provide: getQueueToken('event-notifications'),
            useValue: {
              add: async (name: string, data: any, opts?: any) => {
                console.log(`[Mock Queue] Adding job to queue: ${name} (Redis is offline/disabled)`);
                return { id: 'mock-job-id' };
              },
              on: () => {},
            },
          },
        ]),
  ],
  exports: [NotificationsService, InterestMatcherService]
})
export class NotificationsModule {}
