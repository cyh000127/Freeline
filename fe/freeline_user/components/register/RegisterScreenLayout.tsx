import { ImageBackground, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RegisterScreenLayoutProps = {
  children: React.ReactNode;
};

export default function RegisterScreenLayout({ children }: RegisterScreenLayoutProps) {
  return (
    <ImageBackground
      source={require('@/assets/register/register_background.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topArea}>
          <View style={styles.notchPlaceholder} />
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <Image
                source={require('@/assets/main/logo.png')}
                style={styles.logo}
              ></Image>
              <Text style={styles.logoText}> 줄서잇</Text>
            </View>

            {children}
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topArea: {
    flex: 0.28,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  notchPlaceholder: {
    width: 110,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#000000',
  },
  bottomArea: {
    flex: 0.72,
    backgroundColor: '#F3F3F4',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  card: {
    backgroundColor: '#E9EAED',
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 34,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  logo: {
    height: 28,
    width: 22,
  },
  logoText: {
    fontFamily: 'Pretendard',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#302C55',
  },
});
