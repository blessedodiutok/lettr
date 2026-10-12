// Tokens live in the device keychain (SecureStore), never in plain storage.

import * as SecureStore from "expo-secure-store";

const REFRESH = "lettr_refresh_token";
const ACCESS = "lettr_access_token";

export async function saveTokens(accessToken: string, refreshToken?: string | null) {
  await SecureStore.setItemAsync(ACCESS, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH, refreshToken);
}

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS);
export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH);

export async function clearTokens() {
  await Promise.all([SecureStore.deleteItemAsync(ACCESS), SecureStore.deleteItemAsync(REFRESH)]);
}
