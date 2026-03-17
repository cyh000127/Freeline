import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  content: {
    gap: 10,
  },
});
