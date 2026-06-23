import { Module } from '@nestjs/common';
import { ThreadsController, ThreadsPublicController } from './threads.controller';
import { ThreadsService } from './threads.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ThreadsController, ThreadsPublicController],
  providers: [ThreadsService],
  exports: [ThreadsService]
})
export class ThreadsModule {}
