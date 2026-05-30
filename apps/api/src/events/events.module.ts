import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventsController } from './events.controller';
import { EmailWebhookController } from './email-webhook.controller';
import { GmailOauthController } from './gmail-oauth.controller';
import { EventsService } from './events.service';
import { AiExtractionService } from './ai-extraction.service';
import { EventValidationService } from './event-validation.service';
import { GmailIngestionService } from './gmail-ingestion.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: 'ai-event-processing',
      defaultJobOptions: {
        attempts: 4,
        backoff: {
          type: 'exponential',
          delay: 30000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    }),
  ],
  controllers: [EventsController, EmailWebhookController, GmailOauthController],
  providers: [
    EventsService, 
    AiExtractionService, 
    EventValidationService, 
    GmailIngestionService
  ],
  exports: [EventsService, AiExtractionService, EventValidationService, GmailIngestionService]
})
export class EventsModule {}

