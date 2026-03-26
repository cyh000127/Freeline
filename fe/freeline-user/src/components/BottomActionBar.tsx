import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/theme/colors';
import { spacing } from '@/theme/layout';

type Props = {
  children: ReactNode;
};

export function BottomActionBar({ children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.bar}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.page,
    right: spacing.page,
  },
  bar: {
    backgroundColor: palette.background,
    borderRadius: 26,
    padding: 12,
    shadowColor: palette.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
