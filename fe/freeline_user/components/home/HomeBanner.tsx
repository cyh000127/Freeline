import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeBanner() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/events/event_banner.png')}
        style={styles.banner}
        imageStyle={styles.bannerImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          <Text style={styles.title}>AW2026 스마트{'\n'}제조혁신 산업전</Text>
        </View>
      </ImageBackground>

      <View style={styles.infoRow}>
        <View style={styles.dateGroup}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color="#000"
            style={{ marginTop: 1 }}
          />
          <Text style={styles.infoText}>2026.03.06 - 2026.03.08</Text>
        </View>

        <Text style={styles.infoText}>2일차</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginTop: 4,
    width: '100%',
  },

  banner: {
    width: '100%',
    aspectRatio: 343 / 132,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
  },

  bannerImage: {
    width: '100%',
    height: '100%',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,20,40,0.35)',
  },

  content: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  infoRow: {
    paddingVertical: 5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    width: '100%',
  },

  infoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
