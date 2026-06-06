import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClerkService } from './clerk.service';
import { ClerkAuthGuard } from './clerk.guard';

@Module({
  controllers: [AuthController],
  providers: [
    ClerkService,
    ClerkAuthGuard,
  ],
  exports: [
    ClerkService,
    ClerkAuthGuard,
  ],
})
export class AuthModule {}
