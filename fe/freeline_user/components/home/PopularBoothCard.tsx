import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  boothName: string;
  waitingCountText: string;
  estimatedWaitText: string;
  onMapPress: () => void;
  onReservePress: () => void;
  reserveDisabled?: boolean;
};

export default function PopularBoothCard({
  boothName,
  waitingCountText,
  estimatedWaitText,
  onMapPress,
  onReservePress,
  reserveDisabled = false,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {boothName}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaIcon}>◈</Text>
        <Text style={styles.metaText}>대기 인원: {waitingCountText}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaIcon}>◷</Text>
        <Text style={styles.metaText}>예상 대기시간: {estimatedWaitText}</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.mapButton} onPress={onMapPress}>
          <Text style={styles.mapButtonText}>지도 보기</Text>
        </Pressable>

        <Pressable
          style={[styles.reserveButton, reserveDisabled && styles.reserveButtonDisabled]}
          onPress={onReservePress}
          disabled={reserveDisabled}
        >
          <Text
            style={[
              styles.reserveButtonText,
              reserveDisabled && styles.reserveButtonTextDisabled,
            ]}
          >
            {reserveDisabled ? '예약 불가' : '예약 하기'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 206,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2F2C48',
    marginBottom: 10,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  metaIcon: {
    width: 16,
    fontSize: 12,
    color: '#C6E543',
    marginRight: 4,
  },

  metaText: {
    flex: 1,
    fontSize: 12,
    color: '#2F2C48',
    fontWeight: '500',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },

  mapButton: {
    flex: 1,
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  reserveButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reserveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },

  reserveButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  reserveButtonTextDisabled: {
    color: '#A09EAB',
  },
});
