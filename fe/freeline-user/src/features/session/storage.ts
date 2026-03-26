import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { PersistedSession } from './types';

const STORAGE_KEY = 'freeline-real-user-session';

export const emptySession: PersistedSession = {
  hasSeenOnboarding: false,
  entryCode: null,
  eventId: null,
  visitorId: null,
  accessToken: null,
  refreshToken: null,
  nickname: '',
  requiredAgreed: false,
  marketingAgreed: false,
};

export async function readSession() {
  if (Platform.OS === 'web') {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedSession) : emptySession;
  }

  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as PersistedSession) : emptySession;
}

export async function writeSession(session: PersistedSession) {
  const raw = JSON.stringify(session);

  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, raw);
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEY, raw);
}

export async function clearSessionStorage() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
