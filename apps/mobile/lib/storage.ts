// File: apps/mobile/lib/storage.ts
// Secure token storage using Expo SecureStore
// Refresh tokens must never be stored in AsyncStorage (not encrypted)

import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "lettr_refresh_token";
const ACCESS_TOKEN_KEY = "lettr_access_token";

export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function deleteRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function deleteAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearAllTokens(): Promise<void> {
  await Promise.all([deleteRefreshToken(), deleteAccessToken()]);
}
