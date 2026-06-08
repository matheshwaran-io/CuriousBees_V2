import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk.guard';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  getMe(@Req() req: any) {
    const isGoogleAdminManaged = process.env.AUTH_MODE === 'GOOGLE_ADMIN_MANAGED';

    if (isGoogleAdminManaged) {
      if (!req.user) {
        return {
          success: true,
          access: false,
          reason: 'USER_NOT_PROVISIONED',
          email: req.userEmail
        };
      }
      if (req.user.status === 'SUSPENDED' || req.user.suspended) {
        return {
          success: true,
          access: false,
          reason: 'USER_SUSPENDED',
          user: req.user
        };
      }
    }

    return {
      success: true,
      access: true,
      user: req.user
    };
  }
}

