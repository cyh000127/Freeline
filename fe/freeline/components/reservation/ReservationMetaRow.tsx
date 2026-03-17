import { StyleSheet, Text, View } from 'react-native';

type ReservationMetaRowProps = {
  label: string;
  value: string;
};

export default function ReservationMetaRow({ label, value }: ReservationMetaRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#B9E24D',
    fontWeight: '600',
  },
  value: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});
