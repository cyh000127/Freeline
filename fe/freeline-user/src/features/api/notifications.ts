import { postData } from '@/lib/request';

export type PushPlatform = 'ANDROID' | 'IOS';

export async function upsertPushToken(payload: {
  visitorId: number;
  deviceId: string;
  fcmToken: string;
  platform: PushPlatform;
}) {
  return postData<{
    tokenId: number;
    visitorId: number;
    deviceId: string;
    platform: PushPlatform;
    updatedAt: string;
  }>('/push-notifications/tokens', payload);
}
