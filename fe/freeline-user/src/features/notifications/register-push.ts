import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { upsertPushToken, type PushPlatform } from '@/features/api/notifications';
import { getDeviceId } from './device-id';
import {
  readPushRegistrationCache,
  writePushRegistrationCache,
  type PushRegistrationPayload,
} from './registration-cache';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function getPushPlatform(): PushPlatform {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
}

function isSamePayload(
  current: PushRegistrationPayload | null,
  next: PushRegistrationPayload,
) {
  if (!current) {
    return false;
  }

  return (
    current.visitorId === next.visitorId &&
    current.deviceId === next.deviceId &&
    current.fcmToken === next.fcmToken &&
    current.platform === next.platform
  );
}

export function usePushRegistration(visitorId: number | null) {
  useEffect(() => {
    if (!visitorId || Platform.OS === 'web') {
      return;
    }

    const targetVisitorId = visitorId;
    let active = true;

    async function syncPushToken(tokenValue: string) {
      if (!tokenValue || !active) {
        return;
      }

      const deviceId = await getDeviceId();
      const payload: PushRegistrationPayload = {
        visitorId: targetVisitorId,
        deviceId,
        fcmToken: tokenValue,
        platform: getPushPlatform(),
      };
      const cached = await readPushRegistrationCache();

      if (isSamePayload(cached, payload)) {
        return;
      }

      await upsertPushToken(payload);
      await writePushRegistrationCache(payload);
    }

    async function run() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const current = await Notifications.getPermissionsAsync();
      let status = current.status;

      if (status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        status = requested.status;
      }

      if (status !== 'granted') {
        return;
      }

      const token = await Notifications.getDevicePushTokenAsync();
      await syncPushToken(token.data);
    }

    void run().catch((error) => {
      console.warn('푸시 토큰 등록 실패', error);
    });

    const subscription = Notifications.addPushTokenListener((token) => {
      void syncPushToken(token.data).catch((error) => {
        console.warn('푸시 토큰 갱신 실패', error);
      });
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [visitorId]);
}
