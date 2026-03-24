import { Text, StyleSheet, Pressable, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRScanModalLayout from '@/components/qr/QRScanModalLayout';
import QRFrame from '@/components/qr/QRFrame';

export default function QRScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const handleCancel = () => {
    router.back();

    //     // TODO: replace with toast
    console.log('인증이 취소되었습니다');
  };

  const handleMockSuccess = () => {
    router.replace({
      pathname: '/qr/success',
      params: {
        waitingId: params.waitingId,
        boothName: params.boothName,
        from: params.from ?? 'home',
      },
    });
  };

  return (
    <QRScanModalLayout onCancel={handleCancel}>
      <View style={styles.inner}>
        <Text style={styles.instruction}>화면 안으로 QR코드를 스캔해주세요!</Text>

        <QRFrame />

        {/* TEMP BUTTON for testing flow */}
        <Pressable style={styles.mockButton} onPress={handleMockSuccess}>
          <Text style={styles.mockText}>[스캔하기]</Text>
        </Pressable>
      </View>
    </QRScanModalLayout>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
    gap: 24,
  },
  instruction: {
    color: '#fff',
    fontSize: 14,
  },
  mockButton: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  mockText: {
    color: '#fff',
  },
});
