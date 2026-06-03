import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ApprovedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Bypass approval for Supervisor and Admin. Scholars must be explicitly approved.
    if (user.role === 'RESEARCH_SUPERVISOR' || user.role === 'INSTITUTION_ADMIN' || user.approved) {
      return true;
    }

    throw new ForbiddenException('Access denied. Account is pending supervisor approval.');
  }
}
