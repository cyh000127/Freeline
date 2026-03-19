import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import RegisterScreenLayout from '@/components/register/RegisterScreenLayout';

export default function TicketScreen() {
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState('');

  const isValid = ticketNumber.trim().length > 0;

  return (
    <RegisterScreenLayout>
      <Text style={styles.title}>티켓 일련 번호를 입력해주세요.</Text>

      <TextInput
        value={ticketNumber}
        onChangeText={setTicketNumber}
        placeholder=""
        placeholderTextColor="#B9BAC6"
        style={styles.input}
      />

      <Pressable
        style={[styles.button, !isValid && styles.buttonDisabled]}
        disabled={!isValid}
        onPress={() => router.push('./nickname')}
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
    backgroundColor: '#F8F8F9',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 40,
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
