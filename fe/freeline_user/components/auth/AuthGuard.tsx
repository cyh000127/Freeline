import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthSession } from '@/features/auth/auth-session.context';
import { ActivityIndicator, View } from 'react-native';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { accessToken, nickname, requiredAgreed, isHydrating } = useAuthSession();
  const segments = useSegments();
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isHydrating) return;

    const inProtectedRoute = segments[0] === '(tabs)' || segments[0] === 'reservation_flow' || segments[0] === 'home';
    
    const inAuthGroup = segments[0] === 'register' || segments[0] === 'onboarding';

    const isFullyRegistered = !!accessToken && !!nickname && requiredAgreed;

    if (inProtectedRoute) {
      if (!accessToken) {
        router.replace('/register/ticket');
      } else if (!isFullyRegistered) {
        if (!nickname) {
          router.replace('/register/nickname');
        } else {
          router.replace('/register/confirm');
        }
      } else {
        setIsReady(true);
      }
    } else if (inAuthGroup) {
      if (isFullyRegistered) {
        router.replace('/home');
      } else {
        setIsReady(true);
      }
    } else {
      setIsReady(true);
    }
  }, [accessToken, nickname, requiredAgreed, isHydrating, segments, router]);

  if (isHydrating || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#302C55" />
      </View>
    );
  }

  return <>{children}</>;
}
