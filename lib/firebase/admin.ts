// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let adminApp: App | null = null;

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    try {
      // Option 1: Using service account JSON file
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        );
        
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      }
      // Option 2: Using service account file path
      else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        adminApp = initializeApp({
          credential: cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      } else {
        console.warn('[Firebase Admin] No service account configured, notifications disabled');
        return null;
      }
      
      console.log('[Firebase Admin] Initialized successfully');
      return adminApp;
    } catch (error) {
      console.error('[Firebase Admin] Initialization error:', error);
      return null;
    }
  }
  
  return getApps()[0] || null;
}

// Send notification to a single device
export async function sendNotificationToDevice(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.warn('[FCM] Firebase Admin not initialized');
      return false;
    }

    const messaging = getMessaging(app);
    
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    };

    const response = await messaging.send(message);
    console.log('[FCM] Successfully sent message:', response);
    return true;
  } catch (error) {
    console.error('[FCM] Error sending notification:', error);
    return false;
  }
}

// Send notification to multiple devices
export async function sendNotificationToMultipleDevices(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.warn('[FCM] Firebase Admin not initialized');
      return { successCount: 0, failureCount: tokens.length };
    }

    const messaging = getMessaging(app);
    
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log('[FCM] Batch send result:', {
      success: response.successCount,
      failure: response.failureCount,
    });
    
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('[FCM] Error sending batch notification:', error);
    return { successCount: 0, failureCount: tokens.length };
  }
}

// Send notification to a topic
export async function sendNotificationToTopic(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.warn('[FCM] Firebase Admin not initialized');
      return false;
    }

    const messaging = getMessaging(app);
    
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      topic,
    };

    const response = await messaging.send(message);
    console.log('[FCM] Successfully sent message to topic:', response);
    return true;
  } catch (error) {
    console.error('[FCM] Error sending topic notification:', error);
    return false;
  }
}

// Subscribe device to topic
export async function subscribeToTopic(
  token: string,
  topic: string
): Promise<boolean> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.warn('[FCM] Firebase Admin not initialized');
      return false;
    }

    const messaging = getMessaging(app);
    await messaging.subscribeToTopic([token], topic);
    console.log('[FCM] Successfully subscribed to topic:', topic);
    return true;
  } catch (error) {
    console.error('[FCM] Error subscribing to topic:', error);
    return false;
  }
}

// Unsubscribe device from topic
export async function unsubscribeFromTopic(
  token: string,
  topic: string
): Promise<boolean> {
  try {
    const app = initializeFirebaseAdmin();
    if (!app) {
      console.warn('[FCM] Firebase Admin not initialized');
      return false;
    }

    const messaging = getMessaging(app);
    await messaging.unsubscribeFromTopic([token], topic);
    console.log('[FCM] Successfully unsubscribed from topic:', topic);
    return true;
  } catch (error) {
    console.error('[FCM] Error unsubscribing from topic:', error);
    return false;
  }
}
