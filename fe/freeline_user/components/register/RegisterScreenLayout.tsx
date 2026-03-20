import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RegisterScreenLayoutProps = {
  children: React.ReactNode;
};

export default function RegisterScreenLayout({ children }: RegisterScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.topImageSection}>
          <Image
            source={require('@/assets/register/register_background.png')}
            style={styles.topImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <Image source={require('@/assets/main/logo.png')} style={styles.logo} />
              <Text style={styles.logoText}> 줄서잇</Text>
            </View>

            {children}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F3F4',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F3F4',
  },

  topImageSection: {
    width: '100%',
    height: 220,
    overflow: 'hidden',
  },
  topImage: {
    width: '100%',
    height: '100%',
  },

  bottomArea: {
    // flex: 1,
    marginTop: -12,
    paddingHorizontal: 20,
    paddingTop: 0,
  },

  card: {
    // flex: 1,
    backgroundColor: '#E9EAED',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 28,
  },

  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 22,
    height: 28,
  },
  logoText: {
    fontFamily: 'Pretendard',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#302C55',
  },
});
