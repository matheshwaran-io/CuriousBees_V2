import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { FirebaseAdminService } from './firebase-admin.service';
import { ClerkService } from './clerk.service';
import { ClerkAuthGuard } from './clerk.guard';
import { FirebaseAuthGuard } from './firebase.guard';

@Module({
  controllers: [AuthController],
  providers: [
    FirebaseAdminService,
    ClerkService,
    ClerkAuthGuard,
    FirebaseAuthGuard,
  ],
  exports: [
    FirebaseAdminService,
    ClerkService,
    ClerkAuthGuard,
    FirebaseAuthGuard,
  ],
})
export class AuthModule {}
