import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppImage } from '@/components/AppImage';
import { BottomActionBar } from '@/components/BottomActionBar';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { type BoothDetail } from '@/features/api/booths';
import { useAppData } from '@/features/app-data/context';
import { useTracking } from '@/features/tracking/tracking.context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';

export default function BoothGoodsScreen() {
  usePageTracking('goods');
  const params = useLocalSearchParams<{ boothId: string }>();
  const boothId = Number(params.boothId);
  const { boothDetails, getBoothDetail } = useAppData();
  const { trackEvent } = useTracking();
  const [detail, setDetail] = useState<BoothDetail | null>(boothDetails[boothId] ?? null);
  const [loading, setLoading] = useState(!detail);

  useEffect(() => {
    if (!Number.isFinite(boothId) || detail) {
      return;
    }

    async function load() {
      try {
        const result = await getBoothDetail(boothId);
        setDetail(result);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [boothId, detail, getBoothDetail]);

  useEffect(() => {
    if (!detail) {
      return;
    }

    trackEvent({
      action: 'GOODS_VIEW',
      targetType: 'GOODS',
      targetId: String(detail.boothId),
      metadata: {
        source: 'goods-page',
        booth_name: detail.name,
        goods_count: detail.goods.length,
      },
    });
  }, [detail, trackEvent]);

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.flex}>
        {loading ? <Text style={styles.loading}>불러오는 중...</Text> : null}
        {!loading && !detail ? (
          <View style={styles.emptyWrap}>
            <EmptyState caption="굿즈 정보를 가져오지 못했습니다." title="조회 실패" />
          </View>
        ) : null}

        {detail ? (
          <>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={styles.eyebrow}>굿즈 목록</Text>
                <Text style={styles.title}>{detail.name}</Text>
                <Text style={styles.caption}>
                  {detail.goods.length
                    ? `${detail.goods.length}종의 굿즈를 확인할 수 있습니다.`
                    : '현재 등록된 굿즈가 없습니다.'}
                </Text>
              </View>

              {detail.goods.length ? (
                detail.goods.map((goods) => (
                  <View key={goods.goodsId} style={styles.goodsCard}>
                    <View style={styles.goodsImageWrap}>
                      <AppImage
                        fallback={
                          <View style={styles.goodsFallback}>
                            <Feather color={palette.inkMuted} name="gift" size={26} />
                          </View>
                        }
                        source={goods.imageUrl}
                        style={styles.goodsImage}
                      />
                    </View>

                    <View style={styles.goodsCopy}>
                      <Text style={styles.goodsName}>{goods.name}</Text>
                      <Text style={styles.goodsBody}>
                        {goods.isSoldOut
                          ? '현재 품절 상태입니다.'
                          : '현장 수령 가능한 상태입니다.'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.badge,
                        goods.isSoldOut ? styles.badgeSoldOut : styles.badgeOpen,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeLabel,
                          goods.isSoldOut ? styles.badgeSoldOutText : styles.badgeOpenText,
                        ]}
                      >
                        {goods.isSoldOut ? '품절' : '판매중'}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState
                  caption="이 부스에는 아직 등록된 굿즈가 없습니다."
                  title="표시할 굿즈가 없습니다"
                />
              )}
            </ScrollView>

            <BottomActionBar>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Feather color={palette.ink} name="arrow-left" size={18} />
                <Text style={styles.backLabel}>부스 상세로 돌아가기</Text>
              </Pressable>
            </BottomActionBar>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    paddingHorizontal: 20,
    paddingTop: 20,
    color: palette.textMuted,
  },
  emptyWrap: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 116,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  caption: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  goodsCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  goodsImageWrap: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
  },
  goodsImage: {
    width: '100%',
    height: '100%',
  },
  goodsFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodsCopy: {
    gap: 6,
  },
  goodsName: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  goodsBody: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeOpen: {
    backgroundColor: '#EAFBF1',
  },
  badgeSoldOut: {
    backgroundColor: '#FFF0F0',
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgeOpenText: {
    color: palette.success,
  },
  badgeSoldOutText: {
    color: palette.danger,
  },
  backButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: palette.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backLabel: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
  },
});
