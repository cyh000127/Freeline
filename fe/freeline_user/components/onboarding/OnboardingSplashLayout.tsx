import { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image } from 'react-native';

type Props = {
  title: string;
  description?: string;
  logo?: any;
  children?: ReactNode;
  onPressButton?: () => void;
  showButton?: boolean;
};

export default function OnboardingLayout({ title, description, logo, children }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          {children}

          <View style={styles.textBlock}>
            <View style={styles.titleRow}>
              {logo && <Image source={logo} style={styles.logo} />}

              <Text style={styles.title}>{title}</Text>
            </View>

            {description && <Text style={styles.description}>{description}</Text>}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  textBlock: {
    alignItems: 'center',
    marginTop: 24,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 22,
    height: 30,
    marginRight: 10,
  },

  title: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#373451',
    letterSpacing: -0.6,
  },

  description: {
    marginTop: 10,
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 18,
    color: '#373451',
    textAlign: 'center',
  },

  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#3C355F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
