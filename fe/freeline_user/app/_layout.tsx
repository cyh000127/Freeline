import { Stack } from 'expo-router';
import { QRMockProvider } from './contexts/QRMockContext';

export default function RootLayout() {
  return (
    <QRMockProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </QRMockProvider>
  );
}
