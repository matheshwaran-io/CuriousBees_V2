import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from './supabase.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    SupabaseService,
    SupabaseAuthGuard,
  ],
  exports: [
    SupabaseService,
    SupabaseAuthGuard,
  ],
})
export class AuthModule {}

