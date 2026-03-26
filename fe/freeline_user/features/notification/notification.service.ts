import { saveFcmToken } from './notification.api';

export async function registerPushToken(params: {
  visitorId: number;
  deviceId: string;
  fcmToken: string;
  platform: 'ANDROID' | 'IOS';
}) {
  await saveFcmToken({
    visitorId: params.visitorId,
    deviceId: params.deviceId,
    fcmToken: params.fcmToken,
    platform: params.platform,
  });
}
