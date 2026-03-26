import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { palette } from '@/theme/colors';
import { normalizeImageUrl } from '@/utils/image';

type Props = {
  source?: ImageSourcePropType | string | null;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  fallback?: ReactNode;
};

export function AppImage({
  source,
  style,
  contentFit = 'cover',
  fallback,
}: Props) {
  const [isLoading, setIsLoading] = useState(typeof source === 'string');
  const [hasError, setHasError] = useState(false);

  const resolvedSource = useMemo<ImageSourcePropType | string | null>(() => {
    if (typeof source === 'number') {
      return source;
    }

    if (typeof source === 'string') {
      return normalizeImageUrl(source);
    }

    if (source && typeof source === 'object') {
      return source;
    }

    return null;
  }, [source]);

  if (!resolvedSource || hasError) {
    return <View style={[styles.fallbackWrap, style]}>{fallback}</View>;
  }

  return (
    <View style={[styles.wrap, style]}>
      <Image
        contentFit={contentFit}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
        onLoadStart={() => setIsLoading(true)}
        source={resolvedSource}
        style={StyleSheet.absoluteFillObject}
      />
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={palette.ink} size="small" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 248, 252, 0.72)',
  },
  fallbackWrap: {
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
  },
});
