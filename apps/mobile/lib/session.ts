// Session lifecycle: restore on launch, sign in, sign out, and push registration.

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useAuthStore } from "../stores/auth";
import { api, refreshSession, setSignedOutHandler } from "./api";
import { clearTokens, getRefreshToken, saveTokens } from "./tokens";
import type { Me } from "./types";

let pushToken: string | null = null;

/** Register this device for push notifications. Silently skipped if permission is refused. */
export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "Lettr", importance: Notifications.AndroidImportance.HIGH });
    }
    const existing = await Notifications.getPermissionsAsync();
    const granted = existing.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;
    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    pushToken = data;
    await api("post", "/api/notifications/fcm-token", { token: data });
  } catch (error) {
    console.warn("Push registration skipped:", error);
  }
}

export async function restoreSession(): Promise<void> {
  setSignedOutHandler(() => useAuthStore.getState().clear());
  const token = await refreshSession();
  if (!token) {
    useAuthStore.getState().clear();
    return;
  }
  try {
    useAuthStore.getState().setUser(await api<Me>("get", "/api/auth/me"));
    void registerForPush();
  } catch {
    useAuthStore.getState().clear();
  }
}

export async function startSession(session: { user: Me; accessToken: string; refreshToken: string }) {
  await saveTokens(session.accessToken, session.refreshToken);
  useAuthStore.getState().setUser(session.user);
  void registerForPush();
}

export async function endSession() {
  try {
    if (pushToken) await api("delete", "/api/notifications/fcm-token", { token: pushToken });
    await api("post", "/api/auth/logout", { refreshToken: await getRefreshToken() });
  } catch {
    // Signing out locally still matters if the network call fails.
  }
  await clearTokens();
  useAuthStore.getState().clear();
}
