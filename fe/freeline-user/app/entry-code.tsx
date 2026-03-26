import { useState } from 'react';
import { router } from 'expo-router';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { BrandMark } from '@/components/BrandMark';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useSession } from '@/features/session/context';
import { palette } from '@/theme/colors';
import { toUserErrorMessage } from '@/utils/error';

export default function EntryCodeScreen() {
  const { authenticateEntryCode } = useSession();
  const [entryCode, setEntryCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError('');
      await authenticateEntryCode(entryCode);
      router.replace('/nickname');
    } catch (submitError) {
      setError(toUserErrorMessage(submitError, '인증에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.title}>티켓 일련 번호를 입력해주세요.</Text>
        <TextField
          autoCapitalize="characters"
          autoCorrect={false}
          hint="예시: E1-ABCDEFG"
          onChangeText={setEntryCode}
          placeholder="Entry Code"
          value={entryCode}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <ActionButton
          disabled={submitting || !entryCode.trim()}
          label={submitting ? '인증 중...' : '확인'}
          onPress={() => {
            void handleSubmit();
          }}
        />
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
