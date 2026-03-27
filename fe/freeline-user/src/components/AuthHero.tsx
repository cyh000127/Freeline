import { ImageBackground, StyleSheet, View, useWindowDimensions } from 'react-native';
import { spacing } from '@/theme/layout';

const IMAGE_RATIO = 430 / 287;
const MIN_HEIGHT = 280;
const MAX_HEIGHT = 360;

export function AuthHero() {
  const { width } = useWindowDimensions();
  const heroWidth = Math.min(width, spacing.viewportMaxWidth) + spacing.page * 2;
  const heroHeight = Math.min(Math.max(heroWidth / IMAGE_RATIO, MIN_HEIGHT), MAX_HEIGHT);

  return (
    <ImageBackground
      resizeMode="cover"
      source={require('../../assets/register/register_background.png')}
      style={[styles.hero, { height: heroHeight }]}
    >
      <View style={styles.overlay} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: -spacing.page,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(47, 44, 72, 0.12)',
  },
});
