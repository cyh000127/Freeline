import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import RegisterScreenLayout from '@/components/register/RegisterScreenLayout';
import { useAuthSession } from '@/features/auth/auth-session.context';
import {
  isValidNickname,
  NICKNAME_GUIDE_TEXT,
} from '@/features/auth/nickname';

export default function NicknameScreen() {
  const router = useRouter();
  const { accessToken, nickname, setNickname, isHydrating } = useAuthSession();

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    if (!accessToken) {
      router.replace('/register/ticket');
    }
  }, [accessToken, isHydrating, router]);
  const [localNickname, setLocalNickname] = useState(nickname ?? '');

  const trimmed = useMemo(() => localNickname.trim(), [localNickname]);
  const isValid = useMemo(() => isValidNickname(trimmed), [trimmed]);
  const showError = trimmed.length > 0 && !isValid;

  const handleSubmit = () => {
    if (!isValid) {
      return;
    }

    setNickname(trimmed);
    router.push('/register/confirm');
  };

  return (
    <RegisterScreenLayout>
      <Text style={styles.title}>닉네임을 설정해주세요.</Text>

      <TextInput
        value={localNickname}
        onChangeText={setLocalNickname}
        placeholder=""
        placeholderTextColor="#B9BAC6"
        style={[styles.input, showError && styles.inputError]}
        maxLength={8}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <View style={styles.helperRow}>
        <Text style={styles.helperIcon}>ⓘ</Text>
        <Text style={[styles.helperText, showError && styles.helperError]}>
          {showError ? NICKNAME_GUIDE_TEXT : '한글만 가능, 최대 8자'}
        </Text>
      </View>

      <Pressable
        style={[styles.button, !isValid && styles.buttonDisabled]}
        disabled={!isValid}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>확인</Text>
      </Pressable>
    </RegisterScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Pretendard',
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 22,
  },
  input: {
    height: 40,
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#D9534F',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  helperIcon: {
    fontSize: 12,
    color: '#A3A4B2',
    marginRight: 6,
  },
  helperText: {
    fontFamily: 'Pretendard',
    fontSize: 13,
    lineHeight: 18,
    color: '#A3A4B2',
    fontWeight: '600',
  },
  helperError: {
    color: '#D9534F',
  },
  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#302C55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontFamily: 'Pretendard',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
