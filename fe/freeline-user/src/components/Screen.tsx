import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '@/theme/colors';
import { spacing } from '@/theme/layout';

type Props = {
  children?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
};

export function Screen({ children, scroll = true, padded = true }: Props) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        padded ? styles.padded : null,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.body, padded ? styles.padded : null]}>{children}</View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.screenTop,
    paddingBottom: 120,
  },
  body: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.screenTop,
  },
});
