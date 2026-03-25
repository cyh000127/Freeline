import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

type MySectionProps = {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function MySection({ title, children, style }: MySectionProps) {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
  },
  body: {
    gap: 10,
  },
});
