import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BoothTile } from '@/components/BoothTile';
import { BoothBottomSheet } from '@/components/BoothBottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { fetchExpectedTime, type BoothDetail, type BoothSummary } from '@/features/api/booths';
import { useAppData } from '@/features/app-data/context';
import { useSession } from '@/features/session/context';
import { useTracking } from '@/features/tracking/tracking.context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';

export default function MapScreen() {
  usePageTracking('map');
  const { accessToken } = useSession();
  const { trackEvent } = useTracking();
  const {
    booths,
    createWaiting,
    getBoothDetail,
    lastError,
    selectBooth,
    selectedBooth,
  } = useAppData();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetDetail, setSheetDetail] = useState<BoothDetail | null>(null);
  const [sheetEstimatedMinutes, setSheetEstimatedMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!sheetVisible) {
      setExpanded(false);
    }
  }, [sheetVisible]);

  async function openBoothSheet(booth: BoothSummary) {
    trackEvent({
      action: 'MAP_INTERACTION',
      targetType: 'MAP',
      targetId: String(booth.boothId),
      metadata: {
        interaction: 'open_booth_sheet',
        booth_name: booth.name,
      },
    });
    selectBooth(booth.boothId);
    setSheetVisible(true);
    setLoadingSheet(true);
    setSheetDetail(null);
    setSheetEstimatedMinutes(null);

    try {
      const detail = await getBoothDetail(booth.boothId);
      setSheetDetail(detail);

      try {
        const expected = await fetchExpectedTime(booth.boothId, accessToken);
        setSheetEstimatedMinutes(expected.estimated_minutes);
      } catch (error) {
        console.warn('예상 대기시간 조회 실패', error);
      }
    } finally {
      setLoadingSheet(false);
    }
  }

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SectionTitle caption="운영 중인 부스를 빠르게 찾아보세요" title="부스 배치도" />

          <View style={styles.mapIntro}>
            <Text style={styles.mapIntroTitle}>원하는 부스를 터치해 상세 정보를 펼쳐보세요.</Text>
            <Text style={styles.mapIntroBody}>
              아래에서 시트가 올라오고, 더 펼치면 소개와 굿즈 현황까지 한 화면에서 확인할 수 있습니다.
            </Text>
          </View>

          {lastError ? <ErrorBanner message={lastError} /> : null}

          {booths.length ? (
            <View style={styles.mapBoard}>
              <View style={styles.mapBoardHeader}>
                <Text style={styles.mapBoardTitle}>Hall A Booths</Text>
                <Text style={styles.mapBoardMeta}>{booths.length}개 부스</Text>
              </View>

              <View style={styles.grid}>
                {booths.map((booth) => (
                  <BoothTile
                    booth={booth}
                    key={booth.boothId}
                    onPress={() => {
                      void openBoothSheet(booth);
                    }}
                    selected={selectedBooth?.boothId === booth.boothId}
                  />
                ))}
              </View>
            </View>
          ) : (
            <EmptyState caption="현재 불러온 부스가 없습니다." title="배치도 데이터 없음" />
          )}
        </ScrollView>

        <BoothBottomSheet
          booth={selectedBooth}
          detail={sheetDetail}
          estimatedMinutes={sheetEstimatedMinutes}
          expanded={expanded}
          loading={loadingSheet}
          onClose={() => setSheetVisible(false)}
          onExpandToggle={() => setExpanded((current) => !current)}
          onReserve={() => {
            if (selectedBooth) {
              void createWaiting(selectedBooth.boothId);
            }
          }}
          visible={sheetVisible && !!selectedBooth}
        />

        <FloatingTabBar />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 20,
    paddingBottom: 148,
  },
  mapIntro: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 8,
  },
  mapIntroTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800',
  },
  mapIntroBody: {
    color: palette.textMuted,
    lineHeight: 21,
  },
  mapBoard: {
    backgroundColor: '#E9EEF8',
    borderRadius: 30,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#D8E0F0',
  },
  mapBoardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapBoardTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  mapBoardMeta: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
});
