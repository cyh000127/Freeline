import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'freeline-device-id';

function createDeviceId() {
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${Platform.OS}-${randomPart}`;
}

export async function getOrCreateDeviceId() {
  if (Platform.OS === 'web') {
    const stored = localStorage.getItem(DEVICE_ID_KEY);

    if (stored) {
      return stored;
    }

    const created = createDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  }

  const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (stored) {
    return stored;
  }

  const created = createDeviceId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, created);
  return created;
}
