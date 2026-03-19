import { useRouter } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import OnboardingSlideLayout from '@/components/onboarding/OnboardingSlideLayout';

export default function Slide1() {
  const router = useRouter();

  return (
    <OnboardingSlideLayout
      title="다리 아픈 줄 서기는 그만"
      description={`맵에서 원하는 부스를 찾고,\n터치 한 번으로 미리 대기를 걸어두세요.`}
      currentStep={1}
      onNext={() => router.push('/onboarding/slide2')}
    >
      <Image
        source={require('@/assets/onboarding/slide1.png')}
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
