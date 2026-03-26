import { useState } from 'react';
import { router } from 'expo-router';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { BrandMark } from '@/components/BrandMark';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useSession } from '@/features/session/context';
import { palette } from '@/theme/colors';

export default function NicknameScreen() {
  const { nickname, saveNickname } = useSession();
  const [value, setValue] = useState(nickname);
  const [error, setError] = useState('');

  async function handleNext() {
    const next = value.trim();

    if (!/^[가-힣]{1,8}$/.test(next)) {
      setError('한글만 가능하며 최대 8자까지 입력할 수 있습니다.');
      return;
    }

    await saveNickname(next);
    router.replace('/confirm-profile');
  }

  return (
    <Screen scroll={false}>
      <ImageBackground
        resizeMode="cover"
        source={require('../assets/register/register_background.png')}
        style={styles.hero}
      >
        <View style={styles.overlay} />
      </ImageBackground>

      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <BrandMark compact />
        </View>
        <Text style={styles.title}>닉네임을 설정해주세요.</Text>
        <TextField
          autoCorrect={false}
          hint="한글만 가능, 최대 8자"
          maxLength={8}
          onChangeText={(text) => {
            setValue(text);
            setError('');
          }}
          placeholder="닉네임"
          value={value}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <ActionButton label="확인" onPress={() => void handleNext()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 280,
    marginHorizontal: -20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 44, 72, 0.12)',
  },
  card: {
    marginTop: -60,
    backgroundColor: palette.surface,
    borderRadius: 30,
    padding: 24,
    gap: 18,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  logoWrap: {
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    color: palette.text,
  },
  error: {
    fontSize: 13,
    color: palette.danger,
  },
});
