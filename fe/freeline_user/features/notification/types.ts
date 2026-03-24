export type PlatformType = 'ANDROID' | 'IOS';

export interface SaveFcmTokenRequest {
  visitorId: number;
  deviceId: string;
  fcmToken: string;
  platform: PlatformType;
}

export interface SaveFcmTokenData {
  tokenId: number;
  visitorId: number;
  deviceId: string;
  platform: PlatformType;
  updatedAt: string;
}

export type NotificationType = 'CALL' | 'ENTRY' | 'CANCEL' | 'NOTICE';

export interface NotificationItem {
  notificationId: number;
  type: NotificationType;
  title: string;
  content: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsParams {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

export interface GetNotificationsData {
  unreadCount: number;
  notifications: NotificationItem[];
}

export interface MarkAllNotificationsAsReadData {
  updatedCount: number;
}

export interface SubscribeNotificationsParams {
  accessToken: string;
  lastEventId?: string;
}

export interface NotificationSseMessageEvent {
  type: string;
  data: string;
  lastEventId?: string;
}

export interface SubscribeNotificationsOptions extends SubscribeNotificationsParams {
  onOpen?: () => void;
  onMessage?: (event: NotificationSseMessageEvent) => void;
  onError?: (error: unknown) => void;
}

export interface NotificationSubscription {
  close: () => void;
}
