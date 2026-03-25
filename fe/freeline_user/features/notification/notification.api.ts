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
import EventSource from 'react-native-sse';

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

// 실시간 알림/순번 구독 (SSE)
export const subscribeNotifications = ({
  accessToken,
  lastEventId,
  onOpen,
  onMessage,
  onError,
}: SubscribeNotificationsOptions): NotificationSubscription => {
  const baseUrl = api.defaults.baseURL;

  if (!baseUrl) {
    throw new Error('API baseURL이 설정되어 있지 않습니다.');
  }

  const url = new URL(joinUrl(baseUrl, 'notifications/subscribe'));

  if (lastEventId) {
    url.searchParams.set('lastEventId', lastEventId);
  }

  const eventSource = new EventSource(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });

  eventSource.addEventListener('open', () => {
    onOpen?.();
  });

  eventSource.addEventListener('message', (event: any) => {
    onMessage?.({
      type: event.type,
      data: event.data,
      lastEventId: event.lastEventId,
    });
  });

  eventSource.addEventListener('error', (error: any) => {
    onError?.(error);
  });

  return {
    close: () => {
      eventSource.close();
    },
  };
};

export const getNotifications = async (
  params?: GetNotificationsParams,
): Promise<GetNotificationsData> => {
  const response = await api.get<ApiResponse<GetNotificationsData>>('notifications', {
    params: {
      unreadOnly: params?.unreadOnly ?? false,
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });

  return unwrapResponse(response);
};

// 개별 알림 읽음 처리
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  const response = await api.patch<ApiResponse<null>>(`notifications/${notificationId}`);

  const { success, error } = response.data;

  if (!success) {
    throw new Error(error?.message ?? '알림 읽음 처리에 실패했습니다.');
  }
};

export const markAllNotificationsAsRead =
  async (): Promise<MarkAllNotificationsAsReadData> => {
    const response =
      await api.patch<ApiResponse<MarkAllNotificationsAsReadData>>('notifications');

    return unwrapResponse(response);
  };
