import { useEffect } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { Screen } from '@/components/Screen';
import { useSession } from '@/features/session/context';
import { palette } from '@/theme/colors';

export default function IndexScreen() {
  const session = useSession();

  useEffect(() => {
    if (!session.isReady) {
      return;
    }

    const timer = setTimeout(() => {
      if (!session.hasSeenOnboarding) {
        router.replace('/onboarding');
        return;
      }

      if (!session.accessToken) {
        router.replace('/entry-code');
        return;
      }

      if (!session.nickname) {
        router.replace('/nickname');
        return;
      }

      if (!session.requiredAgreed) {
        router.replace('/confirm-profile');
        return;
      }

      router.replace('/(tabs)/home');
    }, 1200);

    return () => clearTimeout(timer);
  }, [session]);

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.container}>
        <BrandMark />
        <Text style={styles.caption}>모두가 즐거운 박람회의 시작</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#FFFFFF',
  },
  caption: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.ink,
  },
});
