import { unwrap } from '@/lib/api';
import { http } from '@/lib/http';

export type PushPlatform = 'ANDROID' | 'IOS';

export async function upsertPushToken(payload: {
  visitorId: number;
  deviceId: string;
  fcmToken: string;
  platform: PushPlatform;
}) {
  const response = await http.post('/push-notifications/tokens', payload);

  return unwrap<{
    tokenId: number;
    visitorId: number;
    deviceId: string;
    platform: PushPlatform;
    updatedAt: string;
  }>(response);
}
