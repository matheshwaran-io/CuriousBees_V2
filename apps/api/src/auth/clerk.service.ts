import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';

@Injectable()
export class ClerkService implements OnModuleInit {
  private readonly logger = new Logger(ClerkService.name);
  private clerkClient: any = null;

  onModuleInit() {
    const secretKey = process.env.CLERK_SECRET_KEY;
    const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (!secretKey) {
      this.logger.error('CLERK_SECRET_KEY is missing from environment variables.');
      return;
    }

    try {
      this.clerkClient = createClerkClient({
        secretKey,
        publishableKey,
      });
      this.logger.log('Clerk Backend Client initialized successfully.');
    } catch (e: any) {
      this.logger.error(`Failed to initialize Clerk Backend Client: ${e.message}`);
    }
  }

  /**
   * Verify the Clerk Session JWT Token
   */
  async verifyToken(token: string): Promise<any> {
    if (!this.clerkClient) {
      throw new Error('Clerk Backend Client is not initialized due to missing secret keys.');
    }

    try {
      this.logger.debug(`Verifying Clerk token. tokenLength=${token.length}`);
      const secretKey = process.env.CLERK_SECRET_KEY as string;
      const decoded = await verifyToken(token, { secretKey });
      this.logger.log(`Clerk token verified for user sub=${decoded.sub}`);
      return decoded;
    } catch (e: any) {
      this.logger.error(`Clerk token verification failed: ${e.message}`);
      throw new Error(`Clerk token verification failed: ${e.message}`);
    }
  }
}
