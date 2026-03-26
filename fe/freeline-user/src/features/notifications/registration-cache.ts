import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { PushPlatform } from '@/features/api/notifications';

const KEY = 'freeline-user-push-registration';

export type PushRegistrationPayload = {
  visitorId: number;
  deviceId: string;
  fcmToken: string;
  platform: PushPlatform;
};

function isPushRegistrationPayload(value: unknown): value is PushRegistrationPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.visitorId === 'number' &&
    typeof payload.deviceId === 'string' &&
    typeof payload.fcmToken === 'string' &&
    (payload.platform === 'ANDROID' || payload.platform === 'IOS')
  );
}

function parsePayload(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isPushRegistrationPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function readPushRegistrationCache() {
  if (Platform.OS === 'web') {
    return parsePayload(localStorage.getItem(KEY));
  }

  return parsePayload(await SecureStore.getItemAsync(KEY));
}

export async function writePushRegistrationCache(payload: PushRegistrationPayload) {
  const serialized = JSON.stringify(payload);

  if (Platform.OS === 'web') {
    localStorage.setItem(KEY, serialized);
    return;
  }

  await SecureStore.setItemAsync(KEY, serialized);
}

export async function clearPushRegistrationCache() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(KEY);
    return;
  }

  await SecureStore.deleteItemAsync(KEY);
}
