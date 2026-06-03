import { getMessaging, getToken } from 'firebase/messaging';
import { app } from './firebase';

/**
 * Requests Notification permission and registers browser for FCM Push Notifications
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Check feature support
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('Push notifications are not supported in this browser.');
    return null;
  }

  try {
    // 2. Request user permissions
    const permission = await Notification.requestPermission();
    console.log('[FCM] Permission Status:', permission);
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return null;
    }

    // 3. Register service worker with dynamic config
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const configParam = encodeURIComponent(JSON.stringify(firebaseConfig));
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${configParam}`);

    // 4. Retrieve FCM messaging instance
    const messaging = getMessaging(app);

    // 5. Retrieve registration token using project VAPID Key
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey === 'your-fcm-vapid-public-key') {
      console.warn('FCM VAPID key is missing or not configured. Skipping token registration.');
      return null;
    }

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey
    });

    if (token) {
      console.log('[FCM] Token Generated:', token);
      return token;
    } else {
      console.warn('No FCM registration token received.');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving FCM registration token:', error);
    return null;
  }
}

/**
 * Dispatches the registered FCM token to the secure Supabase Backend
 */
export async function sendTokenToBackend(token: string): Promise<void> {
  try {
    const { auth } = await import('./firebase');
    const user = auth.currentUser;
    if (!user) {
      console.warn('Cannot sync FCM token: User is not authenticated.');
      return;
    }

    const idToken = await user.getIdToken();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${API_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ token })
    });

    if (response.ok) {
      console.log('[FCM] Token Registered');
    } else {
      console.error('Failed to sync token with backend:', await response.text());
    }
  } catch (error) {
    console.error('Error while sending device token to database:', error);
  }
}
