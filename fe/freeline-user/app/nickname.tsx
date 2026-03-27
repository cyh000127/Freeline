import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { AuthHero } from '@/components/AuthHero';
import { BrandMark } from '@/components/BrandMark';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useSession } from '@/features/session/context';
import { palette } from '@/theme/colors';
import { toUserErrorMessage } from '@/utils/error';
import { validateNickname } from '@/utils/nickname';

export default function NicknameScreen() {
  const { nickname, saveNickname } = useSession();
  const [value, setValue] = useState(nickname);
  const [error, setError] = useState('');

  async function handleNext() {
    try {
      const next = validateNickname(value);
      await saveNickname(next);
      router.replace('/confirm-profile');
    } catch (submitError) {
      setError(toUserErrorMessage(submitError, '닉네임 저장에 실패했습니다.'));
    }
  }

  return (
    <Screen scroll={false}>
      <AuthHero />

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
