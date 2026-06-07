import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailService } from './mail.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [UsersController],
  providers: [UsersService, MailService],
  exports: [UsersService]
})
export class UsersModule {}

