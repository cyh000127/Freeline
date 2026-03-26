import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerPushToken } from './notification.service';
import { getOrCreateDeviceId } from './device-id';

type Params = {
  visitorId: number | null;
  accessToken: string | null;
};

async function registerToken(visitorId: number) {
  if (Platform.OS === 'web') {
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    throw new Error('알림 권한이 허용되지 않았습니다.');
  }

  const token = await Notifications.getDevicePushTokenAsync();
  const deviceId = await getOrCreateDeviceId();

  await registerPushToken({
    visitorId,
    deviceId,
    fcmToken: token.data,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
  });
}

export function usePushTokenRegistration({ visitorId, accessToken }: Params) {
  useEffect(() => {
    if (!visitorId || !accessToken) {
      return;
    }

    void registerToken(visitorId).catch((error) => {
      console.warn('푸시 토큰 등록 실패:', error);
    });
  }, [visitorId, accessToken]);
}
