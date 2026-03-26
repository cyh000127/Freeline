import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'freeline-real-user-device-id';

function buildDeviceId() {
  const random = Math.random().toString(36).slice(2);
  return `${Platform.OS}-${Date.now()}-${random}`;
}

export async function getDeviceId() {
  if (Platform.OS === 'web') {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      return stored;
    }

    const created = buildDeviceId();
    localStorage.setItem(KEY, created);
    return created;
  }

  const stored = await SecureStore.getItemAsync(KEY);
  if (stored) {
    return stored;
  }

  const created = buildDeviceId();
  await SecureStore.setItemAsync(KEY, created);
  return created;
}
