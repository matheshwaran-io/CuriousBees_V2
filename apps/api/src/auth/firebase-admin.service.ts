import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private firebaseApp: admin.app.App | null = null;
  private missingCredentials: string[] = [];

  onModuleInit() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    const credentialsToCheck = [
      { key: 'FIREBASE_PROJECT_ID', value: projectId },
      { key: 'FIREBASE_CLIENT_EMAIL', value: clientEmail },
      { key: 'FIREBASE_PRIVATE_KEY', value: privateKeyRaw },
    ];

    this.missingCredentials = credentialsToCheck
      .filter((c) => !c.value)
      .map((c) => c.key);

    if (this.missingCredentials.length > 0) {
      this.logger.error(
        `Missing Firebase Admin credentials: ${this.missingCredentials.join(', ')}`,
      );
      return;
    }

    try {
      // Parse private key formatting (replaces string literal \n with actual newlines)
      const privateKey = privateKeyRaw!.replace(/\\n/g, '\n');

      this.firebaseApp = admin.apps.length > 0
        ? admin.app()
        : admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });

      this.logger.log(`Firebase Admin SDK initialized for project: ${projectId}`);
    } catch (e: any) {
      this.logger.error(`Failed to initialize Firebase Admin SDK: ${e.message}`);
    }
  }

  getMissingCredentials(): string[] {
    return this.missingCredentials;
  }

  isInitialized(): boolean {
    return this.firebaseApp !== null;
  }

}
