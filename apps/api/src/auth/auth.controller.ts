import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk.guard';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  getMe(@Req() req: any) {
    return {
      success: true,
      user: req.user
    };
  }
}

