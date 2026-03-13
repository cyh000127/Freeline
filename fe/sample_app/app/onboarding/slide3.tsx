import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';

export default function Slide3() {
  const router = useRouter();

  return (
    <OnboardingLayout
      title="남는 시간은 더 알찬 관람으로"
      description="대기하는 동안 지도를 탐색하여
      다음 방문할 부스들의 동선을 
      똑똑하게 계획해 보세요."
    >
      {/* image placeholder */}
      <View style={{ height: 200 }} />
      <Pressable onPress={() => router.push('/register/ticket')}>
        <Text>→</Text>
      </Pressable>
    </OnboardingLayout>
  );
}
