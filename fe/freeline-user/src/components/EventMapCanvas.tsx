import { useEffect, useMemo, useState } from 'react';
import { Image as RNImage, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BoothSummary } from '@/features/api/booths';
import type { BoothMapArea } from '@/features/api/booth-map';
import { palette } from '@/theme/colors';
import { normalizeImageUrl } from '@/utils/image';
import { getBoothCongestion } from '@/utils/booth-congestion';

type EventMapCanvasArea = BoothMapArea & {
  boothName: string;
  locationCode: string;
  waitingCount: number;
  isEmergencyClosed: boolean;
};

type Props = {
  imageUrl: string | null;
  areas: EventMapCanvasArea[];
  selectedBoothId?: number | null;
  onPressArea: (booth: BoothSummary) => void;
  boothMap: Record<number, BoothSummary>;
};

export function EventMapCanvas({
  imageUrl,
  areas,
  selectedBoothId = null,
  onPressArea,
  boothMap,
}: Props) {
  const resolvedImageUrl = useMemo(() => normalizeImageUrl(imageUrl), [imageUrl]);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    if (!resolvedImageUrl) {
      setImageSize(null);
      setHasImageError(false);
      return;
    }

    let cancelled = false;
    setHasImageError(false);

    RNImage.getSize(
      resolvedImageUrl,
      (width, height) => {
        if (cancelled || width <= 0 || height <= 0) {
          return;
        }

        setImageSize({ width, height });
      },
      () => {
        if (cancelled) {
          return;
        }

        setHasImageError(true);
        setImageSize(null);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [resolvedImageUrl]);

  const aspectRatio = imageSize ? imageSize.width / imageSize.height : null;

  const effectiveSize = useMemo(() => {
    if (!imageSize || containerSize.width <= 0 || containerSize.height <= 0) {
      return null;
    }

    let width = containerSize.width;
    let height = containerSize.height;
    const containerRatio = containerSize.width / containerSize.height;
    const imageRatio = imageSize.width / imageSize.height;

    if (containerRatio > imageRatio) {
      height = containerSize.height;
      width = height * imageRatio;
    } else {
      width = containerSize.width;
      height = width / imageRatio;
    }

    return { width, height };
  }, [containerSize.height, containerSize.width, imageSize]);

  if (!resolvedImageUrl || !aspectRatio || hasImageError || !areas.length) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setContainerSize((current) =>
            current.width === width && current.height === height ? current : { width, height },
          );
        }}
        style={[styles.mapWrap, { aspectRatio }]}
      >
        {effectiveSize ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.overlayStage,
              {
                width: effectiveSize.width,
                height: effectiveSize.height,
              },
            ]}
          >
            {areas.map((area) => {
              const booth = boothMap[area.boothId];

              if (!booth) {
                return null;
              }

              const selected = selectedBoothId === area.boothId;
              const congestion = getBoothCongestion(area.waitingCount, area.isEmergencyClosed);
              const areaTint = selected
                ? 'rgba(47, 44, 72, 0.20)'
                : congestion.tone === 'busy'
                  ? 'rgba(255, 83, 83, 0.14)'
                  : congestion.tone === 'normal'
                    ? 'rgba(255, 188, 66, 0.18)'
                    : 'rgba(24, 193, 125, 0.12)';
              const labelColor = selected ? palette.ink : congestion.textColor;

              return (
                <Pressable
                  key={area.areaId}
                  onPress={() => onPressArea(booth)}
                  style={[
                    styles.area,
                    {
                      left: `${area.xRatio * 100}%`,
                      top: `${area.yRatio * 100}%`,
                      width: `${area.widthRatio * 100}%`,
                      height: `${area.heightRatio * 100}%`,
                      borderColor: selected ? palette.lime : congestion.outlineColor,
                      backgroundColor: areaTint,
                    },
                  ]}
                >
                  <View style={styles.areaLabel}>
                    <Text numberOfLines={1} style={[styles.areaCode, { color: labelColor }]}>
                      {area.locationCode}
                    </Text>
                    <Text numberOfLines={2} style={styles.areaName}>
                      {area.boothName}
                    </Text>
                    <Text numberOfLines={1} style={styles.areaMeta}>
                      현재 대기 {area.waitingCount}명
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#D9D9D9',
    borderRadius: 0,
    overflow: 'hidden',
  },
  mapWrap: {
    width: '100%',
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayStage: {
    position: 'absolute',
  },
  area: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  areaLabel: {
    gap: 8,
  },
  areaCode: {
    fontSize: 11,
    fontWeight: '800',
  },
  areaName: {
    color: palette.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
  },
  areaMeta: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
});
