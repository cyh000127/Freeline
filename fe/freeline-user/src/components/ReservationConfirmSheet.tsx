import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { useWebModalFocus } from '@/hooks/use-web-modal-focus';
import { ActionButton } from './ActionButton';

type Props = {
  visible: boolean;
  boothName: string;
  locationCode: string;
  waitingCount?: number | null;
  estimatedMinutes?: number | null;
  onClose: () => void;
  onConfirm: () => void;
  confirming?: boolean;
};

export function ReservationConfirmSheet({
  visible,
  boothName,
  locationCode,
  waitingCount = null,
  estimatedMinutes = null,
  onClose,
  onConfirm,
  confirming = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const focusRef = useWebModalFocus<View>(visible);

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalRoot}>
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View
          accessibilityViewIsModal
          focusable
          ref={focusRef}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>대기 등록 확인</Text>
              <Text style={styles.title}>{boothName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather color={palette.ink} name="x" size={18} />
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <SummaryRow label="위치" value={locationCode} />
            <SummaryRow
              label="현재 대기"
              value={waitingCount == null ? '확인 전' : `${waitingCount}명`}
            />
            <SummaryRow
              label="예상 시간"
              value={estimatedMinutes == null ? '확인 전' : `약 ${estimatedMinutes}분`}
            />
          </View>

          <Text style={styles.caption}>
            예약 후에는 예약 관리 화면에서 순서 미루기, 취소, QR 도착 확인을 이어서 진행할 수 있습니다.
          </Text>

          <View style={styles.actions}>
            <ActionButton grow label="닫기" onPress={onClose} variant="ghost" />
            <ActionButton
              disabled={confirming}
              grow
              label={confirming ? '등록 중...' : '대기 등록하기'}
              onPress={onConfirm}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 3000,
    elevation: 3000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 14, 29, 0.34)',
    zIndex: 2999,
  },
  sheet: {
    width: '100%',
    maxWidth: spacing.viewportMaxWidth,
    backgroundColor: palette.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 16,
    zIndex: 3001,
    elevation: 3001,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: palette.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  summaryCard: {
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontWeight: '700',
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    color: palette.text,
    fontWeight: '800',
  },
  caption: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
