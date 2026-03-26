import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { BottomActionBar } from '@/components/BottomActionBar';
import { BrandMark } from '@/components/BrandMark';
import { Screen } from '@/components/Screen';
import { useSession } from '@/features/session/context';
import { palette } from '@/theme/colors';

export default function ConfirmProfileScreen() {
  const { nickname, entryCode, eventProfile, confirmProfile } = useSession();

  async function handleStart() {
    await confirmProfile();
    router.replace('/(tabs)/home');
  }

  return (
    <Screen scroll={false}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <BrandMark compact />
        </View>

        <View style={styles.heroBlock}>
          <Text style={styles.eyebrow}>입장 정보 확인</Text>
          <Text style={styles.title}>예매하신 티켓 정보가 맞으신가요?</Text>
          <Text style={styles.caption}>
            확인 후 바로 홈으로 이동해 부스 대기와 배치도 탐색을 시작할 수 있습니다.
          </Text>
        </View>

        <View style={styles.card}>
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

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>다음 단계</Text>
          <Text style={styles.tipBody}>
            홈 화면에서 현재 예약 상태를 확인하고, 배치도 탭에서 원하는 부스를 바로 찾아볼 수 있습니다.
          </Text>
        </View>
      </View>

      <BottomActionBar>
        <ActionButton label="이 정보로 시작하기" onPress={() => void handleStart()} />
      </BottomActionBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: 116,
    gap: 22,
  },
  logoWrap: {
    alignSelf: 'center',
    marginTop: 8,
  },
  heroBlock: {
    gap: 10,
    marginTop: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.inkMuted,
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    padding: 24,
    gap: 18,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '800',
    color: palette.text,
  },
  caption: {
    color: palette.textMuted,
    lineHeight: 22,
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
  tipCard: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  tipTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
  },
  tipBody: {
    color: palette.textMuted,
    lineHeight: 21,
  },
});
