import { useRouter } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import OnboardingSlideLayout from '@/components/onboarding/OnboardingSlideLayout';

export default function Slide3() {
  const router = useRouter();

  return (
    <OnboardingSlideLayout
      title="남는 시간은 더 알찬 관람으로"
      description={`대기하는 동안 지도를 탐색하며\n다음 방문할 부스들의 동선을\n똑똑하게 계획해 보세요.`}
      currentStep={3}
      onNext={() => router.push('/register/ticket')}
    >
      <Image
        source={require('@/assets/onboarding/slide3.png')}
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
