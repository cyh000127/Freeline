import { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  currentStep: 1 | 2 | 3;
  onNext?: () => void;
  onBack?: () => void;
};

export default function OnboardingSlideLayout({
  title,
  description,
  children,
  currentStep,
  onNext,
  onBack,
}: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.topSpacer} />

        <View style={styles.imageSection}>{children}</View>

        <View style={styles.textSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.sideButtonSlot}>
            {onBack ? (
              <Pressable
                style={[styles.circleButton, styles.backButton]}
                onPress={onBack}
              >
                <Ionicons name="arrow-back" size={22} color="#3B3551" />
              </Pressable>
            ) : (
              <View style={styles.placeholderButton} />
            )}
          </View>

          <View style={styles.dots}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[styles.dot, currentStep === step && styles.dotActive]}
              />
            ))}
          </View>

          <View style={styles.sideButtonSlot}>
            {onNext ? (
              <Pressable
                style={[styles.circleButton, styles.nextButton]}
                onPress={onNext}
              >
                <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.placeholderButton} />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
  },
  topSpacer: {
    flex: 1.2,
  },
  imageSection: {
    flex: 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    flex: 1.6,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'bold',
    color: '#111111',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    marginTop: 24,
    fontFamily: 'Pretendard-Medium',
    fontSize: 16,
    lineHeight: 28,
    color: '#222222',
    textAlign: 'center',
    letterSpacing: -0.3,
    paddingHorizontal: 8,
  },
  bottomSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideButtonSlot: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#A5A3AE',
  },
  dotActive: {
    backgroundColor: '#3B3551',
  },
  circleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: '#F0F2F5',
  },
  nextButton: {
    backgroundColor: '#3B3551',
  },
  placeholderButton: {
    width: 52,
    height: 52,
  },
});
