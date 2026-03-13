import { StyleSheet, Text, View } from 'react-native';

export default function HomeBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.imageArea}>
        <Text style={styles.imageText}>Event / Banner Image</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>2026.03.06 - 2026.03.08</Text>
        <Text style={styles.infoText}>Day 2</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7E7EE',
  },
  imageArea: {
    height: 160,
    backgroundColor: '#24327A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFC',
  },
  infoText: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '600',
  },
});
