import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ApprovedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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
