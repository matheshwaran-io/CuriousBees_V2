import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
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

      // Extract email from Clerk token claim, or fallback to Clerk API user query
      let email = decodedToken.email;
      if (!email && decodedToken.sub && this.clerkClient) {
        try {
          this.logger.log(`Email not found in token payload. Querying Clerk API for user details. sub=${decodedToken.sub}`);
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

      const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || 'srmist.edu.in')
        .split(',')
        .map((d) => d.trim().toLowerCase());
      const isAllowedDomain = allowedDomains.some((domain) => normalizedEmail.endsWith('@' + domain));

      if (!isAllowedDomain) {
        throw new UnauthorizedException({
          message: `Only email addresses from the following domains are allowed: ${allowedDomains.join(', ')}`,
          code: 'INVALID_EMAIL_DOMAIN',
        });
      }

      let roleSource = 'Database';
      let user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          interests: {
            include: {
              interest: true
            }
          }
        }
      });

      if (!user) {
        roleSource = 'Default / Main Admin Check';
        
        const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL || 'mr9820@srmist.edu.in';
        const isMainAdmin = normalizedEmail === mainAdminEmail.toLowerCase() || normalizedEmail === 'admin@srmist.edu.in';
        
        const role = isMainAdmin ? 'INSTITUTE_ADMIN' : 'SCHOLAR';
        const approved = isMainAdmin;
        const status = isMainAdmin ? 'ACTIVE' : 'PENDING_SUPERVISOR_APPROVAL';

        this.logger.log(`Creating CuriousBees user for ${normalizedEmail}: Assigned role=${role}, status=${status}`);
        user = await this.prisma.user.create({
          data: {
            clerkId: decodedToken.sub,
            email: normalizedEmail,
            name: decodedToken.name || email.split('@')[0],
            image: decodedToken.picture || null,
            role: role as any,
            approved: approved,
            status: status,
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
        const mainAdminEmail = process.env.MAIN_ADMIN_EMAIL || 'mr9820@srmist.edu.in';
        const isMainAdmin = normalizedEmail === mainAdminEmail.toLowerCase() || normalizedEmail === 'admin@srmist.edu.in';

        this.logger.log(`Existing CuriousBees user found for ${normalizedEmail}; syncing profile fields.`);
        const updateData: any = {
          name: decodedToken.name || user.name,
          image: decodedToken.picture || user.image,
          emailVerified: user.emailVerified || new Date(),
        };

        if (isMainAdmin && user.role !== 'INSTITUTE_ADMIN') {
          this.logger.log(`Upgrading existing user ${normalizedEmail} to INSTITUTE_ADMIN.`);
          updateData.role = 'INSTITUTE_ADMIN';
          updateData.status = 'ACTIVE';
          updateData.approved = true;
        }

        // Self-Healing Migration: Link clerkId if missing on existing user record
        if (!user.clerkId) {
          this.logger.log(`Linking clerkId to existing user record for ${normalizedEmail}.`);
          updateData.clerkId = decodedToken.sub;
        }

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

      this.logger.log(`CuriousBees user sync complete for ${normalizedEmail}: id=${user.id}, role=${user.role}, approved=${user.approved}`);
      
      this.logger.log(`[AUTH] User Email: ${normalizedEmail}`);
      this.logger.log(`[AUTH] User Clerk ID: ${decodedToken.sub}`);
      this.logger.log(`[AUTH] Retrieved Role: ${user.role}`);
      this.logger.log(`[AUTH] Role Source: ${roleSource}`);
      
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
