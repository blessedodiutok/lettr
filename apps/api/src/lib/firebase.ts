// File: apps/api/src/lib/firebase.ts
// Firebase Admin SDK initialisation for sending push notifications
// to iOS and Android devices via FCM (Firebase Cloud Messaging)

import admin from "firebase-admin";
import { env } from "../config/env.js";

let firebaseApp: admin.app.App | undefined;

export function getFirebaseApp(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.warn(
      "⚠️  FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled",
    );
    // Return a dummy object in development so the app still starts
    return {} as admin.app.App;
  }

  const serviceAccount = JSON.parse(
    env.FIREBASE_SERVICE_ACCOUNT_JSON,
  ) as admin.ServiceAccount;

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.info("✅ Firebase Admin SDK initialised");
  return firebaseApp;
}

/**
 * Send a push notification to one or more FCM device tokens
 * Silently skips if Firebase is not configured (local dev without credentials)
 */
export async function sendPushNotification(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  const { tokens, title, body, data } = params;

  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON || tokens.length === 0) {
    return;
  }

  const app = getFirebaseApp();
  if (!app.messaging) return;

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
    data: data ?? {},
    android: {
      priority: "high",
      notification: {
        sound: "default",
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await app.messaging().sendEachForMulticast(message);
    if (response.failureCount > 0) {
      console.warn(
        `FCM: ${response.failureCount} of ${tokens.length} notifications failed`,
      );
    }
  } catch (error) {
    console.error("FCM send error:", error);
  }
}
