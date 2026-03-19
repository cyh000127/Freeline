import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import OnboardingLayout from '@/components/onboarding/OnboardingSplashLayout';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('./slide1');
    }, 3000);

    return () => clearTimeout(timer);
  });

  return (
    <OnboardingLayout
      title="줄서잇"
      description="모두가 즐거운 박람회의 시작"
      logo={require('@/assets/main/logo.png')}
      showButton={false}
    />
  );
}
