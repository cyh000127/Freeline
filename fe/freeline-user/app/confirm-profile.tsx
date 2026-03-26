import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ActionButton } from '@/components/ActionButton';
import { BrandMark } from '@/components/BrandMark';
import { Screen } from '@/components/Screen';
import { useSession } from '@/features/session/context';
import { palette } from '@/theme/colors';

export default function ConfirmProfileScreen() {
  const { nickname, entryCode, eventProfile, saveAgreements } = useSession();
  const [requiredAgreed, setRequiredAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [error, setError] = useState('');

  async function handleStart() {
    if (!requiredAgreed) {
      setError('필수 약관 동의가 필요합니다.');
      return;
    }

    await saveAgreements(requiredAgreed, marketingAgreed);
    router.replace('/(tabs)/home');
  }

  return (
    <Screen>
      <View style={styles.logoWrap}>
        <BrandMark compact />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>예매하신 티켓 정보가 맞으신가요?</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>박람회</Text>
          <Text style={styles.value}>{eventProfile?.name ?? '행사 정보'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>기간</Text>
          <Text style={styles.value}>{eventProfile?.dateLabel ?? '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>닉네임</Text>
          <Text style={styles.value}>{nickname}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Entry Code</Text>
          <Text style={styles.value}>{entryCode}</Text>
        </View>
      </View>

      <View style={styles.checkboxList}>
        <AgreementRow
          checked={requiredAgreed}
          label="[필수] 서비스 이용약관 및 개인정보 수집 동의"
          onPress={() => setRequiredAgreed((current) => !current)}
        />
        <AgreementRow
          checked={marketingAgreed}
          label="[선택] 이벤트 및 마케팅 알림 수신 동의"
          onPress={() => setMarketingAgreed((current) => !current)}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <ActionButton label="이 정보로 시작하기" onPress={() => void handleStart()} />
    </Screen>
  );
}

function AgreementRow({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.agreementRow}>
      <View style={[styles.check, checked ? styles.checked : null]}>
        {checked ? <Feather color="#FFFFFF" name="check" size={12} /> : null}
      </View>
      <Text style={styles.agreementLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignSelf: 'center',
    marginTop: 18,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    padding: 24,
    gap: 18,
    marginTop: 26,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
    color: palette.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: {
    width: 70,
    color: palette.textMuted,
    fontWeight: '700',
  },
  value: {
    flex: 1,
    textAlign: 'right',
    color: palette.text,
    fontWeight: '700',
  },
  checkboxList: {
    marginTop: 26,
    gap: 16,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  checked: {
    backgroundColor: palette.ink,
    borderColor: palette.ink,
  },
  agreementLabel: {
    flex: 1,
    color: palette.textMuted,
    lineHeight: 20,
  },
  error: {
    marginTop: 16,
    color: palette.danger,
    fontSize: 13,
  },
});
