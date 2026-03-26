import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'auth-session';

export type PersistedAuthSession = {
  entryCode: string | null;
  eventId: number | null;
  visitorId: number | null;
  accessToken: string | null;
  nickname: string | null;
  requiredAgreed: boolean;
  marketingAgreed: boolean;
  accountStatus: string | null;
  queueStatus: string | null;
};

export async function saveAuthSession(session: PersistedAuthSession) {
  const raw = JSON.stringify(session);

  if (Platform.OS === 'web') {
    localStorage.setItem(SESSION_KEY, raw);
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, raw);
}

export async function loadAuthSession(): Promise<PersistedAuthSession | null> {
  if (Platform.OS === 'web') {
    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as PersistedAuthSession;
    } catch {
      return null;
    }
  }

  const raw = await SecureStore.getItemAsync(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedAuthSession;
  } catch {
    return null;
  }
}

export async function clearAuthSessionStorage() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}
