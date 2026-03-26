import { useState } from 'react';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { Screen } from '@/components/Screen';
import { useAppData } from '@/features/app-data/context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';

export default function QrScanScreen() {
  usePageTracking('qr-scan');
  const { scanQr } = useAppData();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState('');

  async function submit(qrCode: string) {
    if (locked) {
      return;
    }

    try {
      setLocked(true);
      setError('');
      await scanQr(qrCode);
      router.back();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'QR 인증에 실패했습니다.');
      setLocked(false);
    }
  }

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>도착 인증</Text>
        <ActionButton label="닫기" onPress={() => router.back()} variant="ghost" />
      </View>

      {permission?.granted ? (
        <View style={styles.cameraWrap}>
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              void submit(data);
            }}
            style={styles.camera}
          />
          <View style={styles.overlay}>
            <View style={styles.frame} />
            <Text style={styles.caption}>화면 안으로 QR코드를 스캔해주세요!</Text>
          </View>
        </View>
      ) : (
        <View style={styles.permissionCard}>
          <Text style={styles.caption}>카메라 권한이 필요합니다.</Text>
          <ActionButton label="권한 허용" onPress={() => void requestPermission()} />
        </View>
      )}

      <View style={styles.manualCard}>
        <Text style={styles.manualTitle}>수동 입력</Text>
        <TextInput
          onChangeText={setManualCode}
          placeholder="QR payload 붙여넣기"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
          value={manualCode}
        />
        <ActionButton
          disabled={!manualCode.trim() || locked}
          label={locked ? '처리 중...' : '수동 인증'}
          onPress={() => {
            void submit(manualCode.trim());
          }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
  },
  cameraWrap: {
    height: 420,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    gap: 18,
  },
  frame: {
    width: 260,
    height: 260,
    borderWidth: 4,
    borderColor: palette.lime,
    borderRadius: 30,
    backgroundColor: 'transparent',
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  permissionCard: {
    backgroundColor: palette.ink,
    borderRadius: 30,
    padding: 24,
    gap: 16,
  },
  manualCard: {
    marginTop: 18,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  manualTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    paddingHorizontal: 16,
    color: palette.text,
  },
  error: {
    color: palette.danger,
    fontSize: 13,
  },
});
