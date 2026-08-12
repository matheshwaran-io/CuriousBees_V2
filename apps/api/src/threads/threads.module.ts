import { Module } from '@nestjs/common';
import { ThreadsController, ThreadsPublicController } from './threads.controller';
import { ThreadsService } from './threads.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ThreadsController, ThreadsPublicController],
  providers: [ThreadsService],
  exports: [ThreadsService]
})
export class ThreadsModule {}
