import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClerkService } from './clerk.service';
import { ClerkAuthGuard } from './clerk.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
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
