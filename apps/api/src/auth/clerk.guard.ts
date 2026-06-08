import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkService } from './clerk.service';
import { createClerkClient } from '@clerk/backend';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);
  private clerkClient: any = null;

  constructor(
    private prisma: PrismaService,
    private clerkService: ClerkService,
    private reflector: Reflector,
  ) {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (secretKey) {
      this.clerkClient = createClerkClient({ secretKey });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      throw new UnauthorizedException('Authorization Bearer ID token is required.');
    }

    try {
      this.logger.debug(`Received Clerk bearer token for verification. tokenLength=${token.length}`);
      const decodedToken = await this.clerkService.verifyToken(token);

      let email = decodedToken.email;
      let user = null;

      // 1. Primary fast lookup: Try finding the user in the database by clerkId (sub)
      if (decodedToken.sub) {
        user = await this.prisma.user.findUnique({
          where: { clerkId: decodedToken.sub },
          include: { interests: { include: { interest: true } } }
        });
        
        // Use the database email if the token didn't provide one
        if (user && !email) {
          email = user.email;
        }
      }

      // 2. Fallback: If no email in token and no mapped user, query Clerk API (only happens on first sign-in)
      if (!email && decodedToken.sub && this.clerkClient) {
        try {
          this.logger.log(`Email not found in DB or token. Querying Clerk API for user details. sub=${decodedToken.sub}`);
          const clerkUser = await this.clerkClient.users.getUser(decodedToken.sub);
          email = clerkUser.emailAddresses.find(
            (e: any) => e.id === clerkUser.primaryEmailAddressId
          )?.emailAddress;
        } catch (clerkApiError: any) {
          this.logger.error(`Failed to fetch user email from Clerk API: ${clerkApiError.message}`);
        }
      }

      if (!email) {
        throw new Error('Clerk token/user is valid but does not contain an email address.');
      }

      this.logger.log(`Authenticated Clerk user sub=${decodedToken.sub}, email=${email}`);
      const normalizedEmail = email.toLowerCase();
      const isMeEndpoint = request.url.endsWith('/auth/me');

      // 3. Secondary lookup: If user wasn't found by clerkId, try finding by email
      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            interests: {
              include: {
                interest: true
              }
            }
          }
        });
      }

      if (!user) {
        // Check for Admin Auto-Creation
        if (normalizedEmail === 'r.matheshwaran.io@gmail.com') {
          this.logger.log(`Auto-creating admin account for ${normalizedEmail}`);
          user = await this.prisma.user.create({
            data: {
              clerkId: decodedToken.sub,
              email: normalizedEmail,
              name: decodedToken.name || 'Admin',
              image: decodedToken.picture || null,
              role: 'INSTITUTE_ADMIN',
              approved: true,
              status: 'ACTIVE',
              onboardingCompleted: true,
              emailVerified: new Date(),
            },
            include: {
              interests: {
                include: {
                  interest: true
                }
              }
            }
          });
        } else {
          if (isMeEndpoint) {
            // Allow /api/auth/me to proceed so it can return USER_NOT_PROVISIONED
            request.user = null;
            request.userEmail = normalizedEmail;
            return true;
          }
          throw new UnauthorizedException({
            message: 'Your account has not been provisioned. Please contact an administrator.',
            code: 'USER_NOT_PROVISIONED',
          });
        }
      }

      if (user.status === 'SUSPENDED' || user.suspended) {
        if (isMeEndpoint) {
          request.user = user;
          return true;
        }
        throw new ForbiddenException({
          message: 'Your account has been suspended.',
          code: 'USER_SUSPENDED',
        });
      }

      // Self-Healing Sync: Update clerkId and image if missing
      const updateData: any = {};
      if (!user.clerkId) {
        this.logger.log(`Linking clerkId to existing user record for ${normalizedEmail}.`);
        updateData.clerkId = decodedToken.sub;
      }
      if (decodedToken.picture && !user.image) {
        updateData.image = decodedToken.picture;
      }

      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
          include: {
            interests: {
              include: {
                interest: true
              }
            }
          }
        });
      }

      request.user = user;
      return true;
    } catch (e: any) {
      this.logger.error(`Authentication failed: ${e.message}`);
      throw new UnauthorizedException({
        message: e.message || 'Authentication failed.',
        code: 'CLERK_AUTH_SYNC_FAILED',
      });
    }
  }
}
