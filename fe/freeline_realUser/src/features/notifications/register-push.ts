import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { upsertPushToken } from '@/features/api/notifications';
import { getDeviceId } from './device-id';

export function usePushRegistration(visitorId: number | null) {
  useEffect(() => {
    if (!visitorId || Platform.OS === 'web') {
      return;
    }

    const targetVisitorId = visitorId;

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
      const deviceId = await getDeviceId();

      await upsertPushToken({
        visitorId: targetVisitorId,
        deviceId,
        fcmToken: token.data,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });
    }

    void run().catch((error) => {
      console.warn('푸시 토큰 등록 실패', error);
    });
  }, [visitorId]);
}
