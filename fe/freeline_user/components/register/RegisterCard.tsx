import { StyleSheet, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

export default function RegisterCard({ children }: Props) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EDEEF2',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 26,
  },
});
