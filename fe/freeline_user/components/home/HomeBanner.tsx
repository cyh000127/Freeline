import { StyleSheet, Text, View, ImageBackground } from 'react-native';

export default function HomeBanner() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/events/event_banner.png')}
        style={styles.banner}
        imageStyle={styles.bannerImage}
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          <Text style={styles.title}>AW2026 스마트{'\n'}제조혁신 산업전</Text>
        </View>
      </ImageBackground>
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>2026.03.06 - 2026.03.08</Text>
        <Text style={styles.infoText}>2일차</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },

  banner: {
    height: 190,
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  bannerImage: {
    borderRadius: 0,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,20,40,0.35)',
  },

  content: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBFC53',
    color: '#2F2C48',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
    overflow: 'hidden',
  },

  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  infoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
});
