import { useRouter } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import OnboardingSlideLayout from '@/components/onboarding/OnboardingSlideLayout';

export default function Slide2() {
  const router = useRouter();

  return (
    <OnboardingSlideLayout
      title="내 순서는 실시간 알림으로"
      description={`내 앞 대기 인원이 몇 명인지 확인하고,\n입장할 때가 되면 푸시 알림으로\n바로 알려드려요.`}
      currentStep={2}
      onBack={() => router.back()}
      onNext={() => router.push('/onboarding/slide3')}
    >
      <Image
        source={require('@/assets/onboarding/slide2.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </OnboardingSlideLayout>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 230,
    height: 230,
  },
});
