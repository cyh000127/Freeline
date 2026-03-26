import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDataProvider } from '@/features/app-data/context';
import { SessionProvider, useSession } from '@/features/session/context';
import { TrackingProvider } from '@/features/tracking/tracking.context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SessionProvider>
          <TrackingShell />
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function TrackingShell() {
  const { accessToken, eventId } = useSession();

  return (
    <TrackingProvider accessToken={accessToken} eventId={eventId}>
      <AppDataProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="entry-code" />
          <Stack.Screen name="nickname" />
          <Stack.Screen name="confirm-profile" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="booths/[boothId]" />
          <Stack.Screen name="search" options={{ presentation: 'modal' }} />
          <Stack.Screen name="qr/scan" options={{ presentation: 'modal' }} />
        </Stack>
      </AppDataProvider>
    </TrackingProvider>
  );
}
