import { Stack } from 'expo-router';
import { QRMockProvider } from './contexts/QRMockContext';
import { TrackingProvider } from '@/features/tracking/tracking.context';

export default function RootLayout() {
  // TODO: 실제 인증 연동 시 accessToken을 auth context에서 가져오도록 변경
  const accessToken = null;

  return (
    <TrackingProvider accessToken={accessToken}>
      <QRMockProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </QRMockProvider>
    </TrackingProvider>
  );
}
