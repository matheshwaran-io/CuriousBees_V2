import { Module } from '@nestjs/common';
import { EventsController, EventsPublicController } from './events.controller';
import { EventsService } from './events.service';
import { EmailParserService } from './services/email-parser.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [EventsController, EventsPublicController],
  providers: [EventsService, EmailParserService],
  exports: [EventsService]
})
export class EventsModule {}
