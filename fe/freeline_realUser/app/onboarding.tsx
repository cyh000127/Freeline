import { useState } from 'react';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { BrandMark } from '@/components/BrandMark';
import { Screen } from '@/components/Screen';
import { useSession } from '@/features/session/context';
import { palette } from '@/theme/colors';

const slides = [
  {
    title: '다리 아픈 줄 서기는 그만',
    body: '맵에서 원하는 부스를 찾고, 터치 한 번으로 미리 대기를 걸어두세요.',
    image: require('../assets/onboarding/slide1.png'),
  },
  {
    title: '내 순서는 실시간 알림으로',
    body: '내 앞 대기 인원을 확인하고, 입장할 때가 되면 푸시 알림으로 바로 알려드려요.',
    image: require('../assets/onboarding/slide2.png'),
  },
  {
    title: '남는 시간은 더 알찬 관람으로',
    body: '대기하는 동안 지도를 탐색하며 다음 방문할 부스들의 동선을 똑똑하게 계획해 보세요.',
    image: require('../assets/onboarding/slide3.png'),
  },
] as const;

export default function OnboardingScreen() {
  const { completeOnboarding } = useSession();
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  async function handleNext() {
    if (index < slides.length - 1) {
      setIndex(index + 1);
      return;
    }

    await completeOnboarding();
    router.replace('/entry-code');
  }

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BrandMark compact />
        </View>

        <View style={styles.hero}>
          <Image resizeMode="contain" source={slide.image} style={styles.image} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, dotIndex) => (
              <View
                key={dotIndex}
                style={[styles.dot, dotIndex === index ? styles.dotActive : null]}
              />
            ))}
          </View>
          <ActionButton
            label={index === slides.length - 1 ? '시작하기' : '다음'}
            onPress={() => {
              void handleNext();
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 10,
  },
  hero: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '72%',
    height: '100%',
  },
  copy: {
    gap: 18,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 25,
    color: palette.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  footer: {
    gap: 24,
    marginBottom: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#CFD5E7',
  },
  dotActive: {
    width: 34,
    backgroundColor: palette.ink,
  },
});
