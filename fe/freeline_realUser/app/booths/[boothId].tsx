import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ActionButton } from '@/components/ActionButton';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { type BoothDetail } from '@/features/api/booths';
import { useAppData } from '@/features/app-data/context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';

export default function BoothDetailScreen() {
  usePageTracking('booth-detail');
  const params = useLocalSearchParams<{ boothId: string }>();
  const boothId = Number(params.boothId);
  const { boothDetails, createWaiting, getBoothDetail } = useAppData();
  const [detail, setDetail] = useState<BoothDetail | null>(boothDetails[boothId] ?? null);
  const [loading, setLoading] = useState(!detail);

  useEffect(() => {
    if (!Number.isFinite(boothId) || detail) {
      return;
    }

    async function load() {
      const result = await getBoothDetail(boothId);
      setDetail(result);
      setLoading(false);
    }

    void load();
  }, [boothId, detail, getBoothDetail]);

  return (
    <Screen>
      <View style={styles.header}>
        <ActionButton label="뒤로" onPress={() => router.back()} variant="ghost" />
      </View>

      {loading ? <Text style={styles.loading}>불러오는 중...</Text> : null}
      {!loading && !detail ? (
        <EmptyState caption="부스 정보를 가져오지 못했습니다." title="조회 실패" />
      ) : null}

      {detail ? (
        <View style={styles.content}>
          <View style={styles.hero}>
            {detail.representativeImageUrl ? (
              <Image contentFit="cover" source={detail.representativeImageUrl} style={styles.heroImage} />
            ) : (
              <View style={styles.heroFallback}>
                <Text style={styles.heroFallbackText}>{detail.name}</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{detail.name}</Text>
          <Text style={styles.meta}>위치 {detail.locationCode}</Text>
          <Text style={styles.meta}>현재 대기 {detail.waitingCount}명</Text>

          <ActionButton
            label="이 부스 대기 등록"
            onPress={() => {
              void createWaiting(detail.boothId);
            }}
          />

          <View style={styles.goodsCard}>
            <Text style={styles.goodsTitle}>굿즈 목록</Text>
            {detail.goods.length ? (
              detail.goods.map((goods) => (
                <View key={goods.goodsId} style={styles.goodsRow}>
                  <Text style={styles.goodsName}>{goods.name}</Text>
                  <Text style={[styles.goodsState, goods.isSoldOut ? styles.soldOut : styles.inStock]}>
                    {goods.isSoldOut ? '품절' : '수량 있음'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.meta}>등록된 굿즈가 없습니다.</Text>
            )}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 18,
  },
  loading: {
    color: palette.textMuted,
  },
  content: {
    gap: 16,
    paddingBottom: 40,
  },
  hero: {
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.ink,
    paddingHorizontal: 24,
  },
  heroFallbackText: {
    color: '#FFFFFF',
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '800',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.text,
  },
  meta: {
    color: palette.textMuted,
  },
  goodsCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  goodsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.text,
  },
  goodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goodsName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.text,
  },
  goodsState: {
    fontSize: 12,
    fontWeight: '700',
  },
  inStock: {
    color: palette.success,
  },
  soldOut: {
    color: palette.danger,
  },
});
