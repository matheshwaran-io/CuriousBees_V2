import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ApprovedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }
    // Admin is automatically approved.
    // Scholar and Supervisor must have approved === true and status === 'APPROVED'.
    if (user.role === 'ADMIN' || user.role === 'INSTITUTE_ADMIN') {
      return true;
    }
    
    if (user.approved && (user.status === 'APPROVED' || user.status === 'ACTIVE')) {
      return true;
    }

    throw new ForbiddenException('Access denied. Account is pending approval or onboarding.');
  }
}
