import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import RegisterScreenLayout from '@/components/register/RegisterScreenLayout';
import { useAuthSession } from '@/features/auth/auth-session.context';

export default function TicketScreen() {
  const router = useRouter();
  const { authenticateEntryCode } = useAuthSession();

  const [ticketNumber, setTicketNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const trimmed = useMemo(() => ticketNumber.trim(), [ticketNumber]);
  const isValid = trimmed.length > 0;
  const disabled = !isValid || submitting;

  const handleSubmit = async () => {
    if (disabled) {
      return;
    }

    try {
      setSubmitting(true);
      setErrorText('');

      await authenticateEntryCode(trimmed);
      router.push('/register/nickname');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '입장 코드 인증에 실패했습니다.';
      setErrorText(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RegisterScreenLayout>
      <Text style={styles.title}>티켓 일련 번호를 입력해주세요.</Text>

      <TextInput
        value={ticketNumber}
        onChangeText={(value) => {
          setTicketNumber(value);
          if (errorText) {
            setErrorText('');
          }
        }}
        placeholder=""
        placeholderTextColor="#B9BAC6"
        style={[styles.input, !!errorText && styles.inputError]}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!submitting}
      />

      {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}

      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        disabled={disabled}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>확인</Text>
        )}
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
    backgroundColor: '#F8F8F9',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#D9534F',
  },
  errorText: {
    marginBottom: 24,
    fontFamily: 'Pretendard',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
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
