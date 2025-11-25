// Firebase client configuration for Push Notifications
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get messaging instance
let messaging: any = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

// Request permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('[FCM] Push notifications not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('[FCM] Notification permission granted');
      
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      
      if (currentToken) {
        console.log('[FCM] FCM Token:', currentToken);
        return currentToken;
      } else {
        console.log('[FCM] No registration token available');
        return null;
      }
    } else {
      console.log('[FCM] Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting notification permission:', error);
    return null;
  }
}

// Listen for foreground messages
export function onMessageListener() {
  return new Promise((resolve) => {
    if (!messaging) {
      console.log('[FCM] Messaging not initialized');
      return;
    }
    
    onMessage(messaging, (payload) => {
      console.log('[FCM] Message received:', payload);
      resolve(payload);
    });
  });
}

export { app, messaging };
