import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/theme/colors';
import { useWebModalFocus } from '@/hooks/use-web-modal-focus';
import { ActionButton } from './ActionButton';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  hideCancel?: boolean;
  confirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = '닫기',
  hideCancel = false,
  confirming = false,
  onConfirm,
  onClose,
}: Props) {
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
          style={styles.dialog}
        >
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>

          <View style={styles.actions}>
            {hideCancel ? null : (
              <ActionButton grow label={cancelLabel} onPress={onClose} variant="ghost" />
            )}
            <ActionButton
              disabled={confirming}
              grow
              label={confirming ? '처리 중...' : confirmLabel}
              onPress={onConfirm}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 4000,
    elevation: 4000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 14, 29, 0.34)',
    zIndex: 3999,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: palette.background,
    padding: 22,
    gap: 18,
    zIndex: 4001,
    elevation: 4001,
  },
  copy: {
    gap: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: palette.text,
  },
  body: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
