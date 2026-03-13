import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';

export default function Slide2() {
  const router = useRouter();

  return (
    <OnboardingLayout
      title="내 순서는 실시간 알림으로"
      description="내 앞 대기 인원이 몇 명인지 확인하고,
      입장할 때가 되면 푸시 알림으로
      바로 알려드려요."
    >
      {/* image placeholder */}
      <View style={{ height: 200 }} />

      {/* navigation */}
      <Pressable onPress={() => router.push('./slide3')}>
        <Text>→</Text>
      </Pressable>
      {/* <Pressable onPress={() => router.push('./slide1')}>
        <Text>back</Text>
      </Pressable> */}
    </OnboardingLayout>
  );
}
