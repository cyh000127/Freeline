// import { AppState } from 'react-native';
import { saveFcmToken, subscribeNotifications } from './notification.api';

let currentSubscription: { close: () => void } | null = null;

export async function registerPushToken(params: {
  visitorId: number;
  accessToken: string;
  deviceId: string;
  fcmToken: string;
}) {
  await saveFcmToken({
    visitorId: params.visitorId,
    deviceId: params.deviceId,
    fcmToken: params.fcmToken,
    platform: 'ANDROID',
  });
}

export function connectNotificationSse(params: {
  accessToken: string;
  lastEventId?: string;
  onMessage: (raw: string) => void;
  onOpen?: () => void;
  onError?: (error: unknown) => void;
}) {
  if (currentSubscription) {
    currentSubscription.close();
    currentSubscription = null;
  }

  currentSubscription = subscribeNotifications({
    accessToken: params.accessToken,
    lastEventId: params.lastEventId,
    onOpen: params.onOpen,
    onError: params.onError,
    onMessage: (event) => {
      params.onMessage(event.data);
    },
  });

  return currentSubscription;
}

export function disconnectNotificationSse() {
  currentSubscription?.close();
  currentSubscription = null;
}
