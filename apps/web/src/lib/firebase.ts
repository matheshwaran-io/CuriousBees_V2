import { initializeApp, getApps, getApp } from 'firebase/app';

console.log('[Firebase Client] Loading client SDK for FCM support...');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingFirebaseConfig.length > 0) {
  console.warn(
    '[Firebase Client] Missing Firebase web config keys (this is fine in dev bypass if FCM is unused):',
    missingFirebaseConfig
  );
}

// Initialize Firebase app (Singleton) for FCM
export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();