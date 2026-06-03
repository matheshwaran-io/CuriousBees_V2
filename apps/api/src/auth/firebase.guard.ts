import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseAdminService } from './firebase-admin.service';

function detectRoleFromEmail(email: string): { role: string; approved: boolean } {
  // TODO: Production: Replace development email-pattern role detection with @srmist.edu.in validation.
  const username = email.split('@')[0].toLowerCase();
  
  if (username.includes('.')) {
    return { role: 'INSTITUTION_ADMIN', approved: true };
  } else if (/[a-zA-Z]/.test(username) && /[0-9]/.test(username)) {
    return { role: 'RESEARCH_SCHOLAR', approved: false };
  } else if (/^[a-zA-Z]+$/.test(username)) {
    return { role: 'RESEARCH_SUPERVISOR', approved: true };
  }
  
  return { role: 'RESEARCH_SCHOLAR', approved: false };
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private prisma: PrismaService,
    private firebaseAdmin: FirebaseAdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      let decodedToken: any;

      if (process.env.NODE_ENV !== 'production' && token.startsWith('mock-bypass-token-')) {
        this.logger.warn('Using local mock Firebase auth bypass token.');
        const isFaculty = token.includes('faculty');
        decodedToken = {
          uid: isFaculty ? 'mock-bypass-uid-faculty' : token.includes('admin') ? 'mock-bypass-uid-admin' : 'mock-bypass-uid-scholar',
          email: isFaculty ? 'faculty.mock@srmist.edu.in' : token.includes('admin') ? 'admin.mock@srmist.edu.in' : 'scholar.mock@srmist.edu.in',
          name: isFaculty ? 'Dr. Priya (Mock Faculty)' : token.includes('admin') ? 'Admin User' : 'Karthik Kumar (Mock Scholar)',
          picture: isFaculty 
            ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        };
      } else {
        this.logger.debug(`Received Firebase bearer token for verification. tokenLength=${token.length}`);
        decodedToken = await this.firebaseAdmin.verifyToken(token);
      }

      const email = decodedToken.email || '';
      if (!email) {
        throw new Error('Firebase token is valid but does not contain an email claim.');
      }

      this.logger.log(`Authenticated Firebase user uid=${decodedToken.uid}, email=${email}`);
      const username = email.split('@')[0].toLowerCase();
      const normalizedEmail = email.toLowerCase();

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
        const { role, approved } = detectRoleFromEmail(normalizedEmail);

        this.logger.log(`Creating CuriousBees user for ${normalizedEmail}: Assigned role=${role}, Approved status=${approved}`);
        user = await this.prisma.user.create({
          data: {
            firebaseUid: decodedToken.uid,
            email: normalizedEmail,
            name: decodedToken.name || email.split('@')[0],
            image: decodedToken.picture || null,
            role: role as any,
            approved: approved,
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
        this.logger.log(`Existing CuriousBees user found for ${normalizedEmail}; syncing profile fields.`);
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            name: decodedToken.name || user.name,
            image: decodedToken.picture || user.image,
            emailVerified: user.emailVerified || new Date(),
          },
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
      request.user = user;
      return true;
    } catch (e: any) {
      this.logger.error(`Authentication failed: ${e.message}`);
      throw new UnauthorizedException({
        message: e.message || 'Authentication failed.',
        code: 'FIREBASE_AUTH_SYNC_FAILED',
        details: this.firebaseAdmin.getMissingCredentials?.() || [],
      });
    }
  }
}
