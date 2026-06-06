import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { InterestMatcherService } from './interest-matcher.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationProcessor } from './notification.processor';
import { DigestScheduler } from './digest.scheduler';

@Module({
  imports: [
    AuthModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'event-notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    InterestMatcherService,
    NotificationProcessor,
    DigestScheduler,
  ],
  exports: [NotificationsService, InterestMatcherService]
})
export class NotificationsModule {}
