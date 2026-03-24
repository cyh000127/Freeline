import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type MetaIcon = 'queue' | 'time' | 'location';

type Props = {
  icon: MetaIcon;
  label: string;
  value: string;
};

const iconNameMap: Record<MetaIcon, keyof typeof Ionicons.glyphMap> = {
  queue: 'layers-outline',
  time: 'time-outline',
  location: 'location-outline',
};

export default function ReservationMetaRow({ icon, label, value }: Props) {
  return (
    <View style={styles.row}>
      <Ionicons name={iconNameMap[icon]} size={16} color="#D7FF2F" />
      <Text style={styles.text}>
        <Text style={styles.label}>{label} </Text>
        <Text style={styles.value}>{value}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    flex: 1,
    color: '#F3F4FA',
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontWeight: '500',
    color: '#F3F4FA',
  },
  value: {
    fontWeight: '500',
    color: '#F3F4FA',
  },
});
