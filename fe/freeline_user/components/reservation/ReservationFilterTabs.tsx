import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ReservationFilter = 'all' | 'current' | 'finished';

interface Props {
  value: ReservationFilter;
  onChange: (value: ReservationFilter) => void;
}

const tabs: { key: ReservationFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'current', label: '현재 예약' },
  { key: 'finished', label: '완료/취소' },
];

export default function ReservationFilterTabs({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = value === tab.key;

        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#2F2C53',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
