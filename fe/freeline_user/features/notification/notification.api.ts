import { api } from '@/api/axios';
import type { ApiResponse } from '@/features/waiting/types';
import type {
  SaveFcmTokenRequest,
  SaveFcmTokenData,
  SubscribeNotificationsOptions,
  GetNotificationsData,
  GetNotificationsParams,
  NotificationSubscription,
  MarkAllNotificationsAsReadData,
} from './types';

function unwrapResponse<T>(response: { data: ApiResponse<T> }): T {
  const { success, data, error } = response.data;

  if (!success || data == null) {
    throw new Error(error?.message ?? '요청 처리에 실패했습니다.');
  }

  return data;
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

// FCM 토큰 저장/갱신
export const saveFcmToken = async (
  payload: SaveFcmTokenRequest,
): Promise<SaveFcmTokenData> => {
  const response = await api.post<ApiResponse<SaveFcmTokenData>>(
    'push-notifications/tokens',
    payload,
  );

  return unwrapResponse(response);
};

/*
// DEPRECATED: 실시간 알림/순번 구독 (SSE) - Backend API does not exist
export const subscribeNotifications = ({
  accessToken,
  lastEventId,
  onOpen,
  onMessage,
  onError,
}: SubscribeNotificationsOptions): NotificationSubscription => {
  console.warn('subscribeNotifications is deprecated. SSE is not supported for visitors on backend.');
  return { close: () => {} };
};

// DEPRECATED: Backend API does not exist
export const getNotifications = async (
  params?: GetNotificationsParams,
): Promise<GetNotificationsData> => {
  console.warn('getNotifications is deprecated. Backend API does not exist.');
  return { notifications: [], unreadCount: 0 };
};

// DEPRECATED: 개별 알림 읽음 처리 - Backend API does not exist
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  console.warn('markNotificationAsRead is deprecated. Backend API does not exist.');
};

// DEPRECATED: Backend API does not exist
export const markAllNotificationsAsRead =
  async (): Promise<MarkAllNotificationsAsReadData> => {
    console.warn('markAllNotificationsAsRead is deprecated. Backend API does not exist.');
    return { updatedCount: 0 };
  };
*/
