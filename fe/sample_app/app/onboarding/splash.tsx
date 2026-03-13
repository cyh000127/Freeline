import { useRouter } from 'expo-router';
import { Text, Pressable } from 'react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <OnboardingLayout title="줄서잇" description="모두가 즐거운 박람회의 시작">
      <Pressable onPress={() => router.push('./slide1')}>
        <Text> 시작하기 </Text>
      </Pressable>
    </OnboardingLayout>
  );
}
