import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRScanModalLayout from '@/components/qr/QRScanModalLayout';
import QRFrame from '@/components/qr/QRFrame';
import { useAuthSession } from '@/features/auth/auth-session.context';
import { scanQr } from '@/features/waiting/qr.api';

export default function QRScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { accessToken } = useAuthSession();

  const [qrCode, setQrCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const trimmed = useMemo(() => qrCode.trim(), [qrCode]);

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    if (!trimmed) {
      Alert.alert('안내', 'QR payload를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const data = await scanQr(accessToken, { qrCode: trimmed });

      router.replace({
        pathname: '/qr/success',
        params: {
          waitingId: String(data.waitingId),
          boothName: params.boothName ?? String(data.boothId),
          from: params.from ?? 'home',
          registeredAt: data.registeredAt,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'QR 인증에 실패했습니다.';
      Alert.alert('QR 인증 오류', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <QRScanModalLayout onCancel={handleCancel}>
      <View style={styles.inner}>
        <Text style={styles.instruction}>QR 스캔 결과를 입력하거나 붙여넣어 주세요.</Text>

        <QRFrame />

        <TextInput
          value={qrCode}
          onChangeText={setQrCode}
          placeholder="FREELINE|FRONT_QUEUE_ARRIVAL|..."
          placeholderTextColor="#B9BAC6"
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          editable={!submitting}
        />

        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#111111" />
          ) : (
            <Text style={styles.submitText}>도착 인증하기</Text>
          )}
        </Pressable>
      </View>
    </QRScanModalLayout>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  instruction: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#111111',
  },
  submitButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#D7FF2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
});
