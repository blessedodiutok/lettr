// Firebase Admin SDK for push notifications (FCM).
// Disabled with a single warning when credentials are missing.

import admin from "firebase-admin";
import { env } from "../config/env.js";

let firebaseApp: admin.app.App | null | undefined;

export function getFirebaseApp(): admin.app.App | null {
  if (firebaseApp !== undefined) return firebaseApp;
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled");
    firebaseApp = null;
    return firebaseApp;
  }
  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount;
  firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.info("✅ Firebase Admin SDK initialised");
  return firebaseApp;
}

const isExpoToken = (token: string) => /^Expo(nent)?PushToken\[/.test(token);

/** Expo push service — used by the Expo app; needs no server credentials. */
async function sendExpoPush(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(tokens.map((to) => ({ to, title, body, data, sound: "default", channelId: "default" }))),
  });
  if (!response.ok) console.warn(`Expo push failed with HTTP ${response.status}`);
}

/** Send to every registered device; Expo tokens and raw FCM tokens are both supported. */
export async function sendPushNotification(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  const expoTokens = params.tokens.filter(isExpoToken);
  const fcmTokens = params.tokens.filter((token) => !isExpoToken(token));
  if (expoTokens.length) await sendExpoPush(expoTokens, params.title, params.body, params.data);

  const app = getFirebaseApp();
  if (!app || fcmTokens.length === 0) return;

  const response = await app.messaging().sendEachForMulticast({
    tokens: fcmTokens,
    notification: { title: params.title, body: params.body },
    data: params.data ?? {},
    android: { priority: "high", notification: { sound: "default", channelId: "default" } },
    apns: { payload: { aps: { sound: "default" } } },
  });
  if (response.failureCount > 0) {
    console.warn(`FCM: ${response.failureCount} of ${fcmTokens.length} notifications failed`);
  }
}
