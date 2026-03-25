import { Stack } from 'expo-router';
import { QRMockProvider } from './contexts/QRMockContext';
import { TrackingProvider } from '@/features/tracking/tracking.context';
import {
  NotificationLiveProvider,
  useNotificationLive,
} from '@/features/notification/notification-live.context';
import { useNotificationSubscription } from '@/features/notification/useNotificationSubscription';
import {
  AuthSessionProvider,
  useAuthSession,
} from '@/features/auth/auth-session.context';

function NotificationSubscriptionBridge() {
  const { accessToken } = useAuthSession();
  const { notifyIncoming } = useNotificationLive();

  useNotificationSubscription({
    accessToken,
    onMessage: (raw) => {
      console.log('Global SSE event:', raw);
      notifyIncoming();
    },
  });

  return null;
}

function AppProviders() {
  const { accessToken } = useAuthSession();

  return (
    <TrackingProvider accessToken={accessToken}>
      <QRMockProvider>
        <NotificationLiveProvider>
          <NotificationSubscriptionBridge />
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationLiveProvider>
      </QRMockProvider>
    </TrackingProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <AppProviders />
    </AuthSessionProvider>
  );
}
