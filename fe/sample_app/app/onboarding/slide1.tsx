import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';

export default function Slide1() {
  const router = useRouter();
  return (
    <OnboardingLayout
      title="다리 아픈 줄 서기는 그만"
      description="앱에서 원하는 부스를 찾고
      터치 한 번으로 미리 대기를 걸어두세요."
    >
      {/* image placeholder */}
      <View style={{ height: 200 }} />

      {/* navigation */}
      <Pressable onPress={() => router.push('./slide2')}>
        <Text>→</Text>
      </Pressable>
    </OnboardingLayout>
  );
}
