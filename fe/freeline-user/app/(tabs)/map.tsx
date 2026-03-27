import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BoothTile } from '@/components/BoothTile';
import { BoothBottomSheet } from '@/components/BoothBottomSheet';
import { BoothListCard } from '@/components/BoothListCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { EventMapCanvas } from '@/components/EventMapCanvas';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { ReservationConfirmSheet } from '@/components/ReservationConfirmSheet';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import {
  fetchBoothDetail,
  fetchExpectedTime,
  type BoothDetail,
  type BoothSummary,
} from '@/features/api/booths';
import { fetchVisitorBoothMap, type BoothMapArea } from '@/features/api/booth-map';
import { WAITING_LIMIT_MESSAGE } from '@/features/app-data/constants';
import { useAppData } from '@/features/app-data/context';
import { useSession } from '@/features/session/context';
import { useToast } from '@/features/toast/context';
import { useTracking } from '@/features/tracking/tracking.context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';
import { getBoothCongestion } from '@/utils/booth-congestion';
import { toUserErrorMessage } from '@/utils/error';

const mapTabs = [
  { key: 'map', label: '부스 배치도' },
  { key: 'list', label: '부스 목록' },
] as const;

export default function MapScreen() {
  usePageTracking('map');
  const { accessToken, eventId, eventProfile } = useSession();
  const { trackEvent } = useTracking();
  const { showToast } = useToast();
  const {
    boothDetails,
    booths,
    cancelWaiting,
    createWaiting,
    findWaitingByBoothId,
    getBoothDetail,
    lastError,
    postponeWaiting,
    selectBooth,
    selectedBooth,
  } = useAppData();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetDetail, setSheetDetail] = useState<BoothDetail | null>(null);
  const [sheetEstimatedMinutes, setSheetEstimatedMinutes] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof mapTabs)[number]['key']>('map');
  const [detailMap, setDetailMap] = useState<Record<number, BoothDetail>>({});
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmingReserve, setConfirmingReserve] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [limitVisible, setLimitVisible] = useState(false);
  const [registerErrorMessage, setRegisterErrorMessage] = useState<string | null>(null);
  const [registerErrorPending, setRegisterErrorPending] = useState<string | null>(null);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(eventProfile?.mapImageUrl ?? null);
  const [mapAreas, setMapAreas] = useState<BoothMapArea[]>([]);
  const [mapLoadState, setMapLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (!registerErrorPending || confirmVisible) {
      return;
    }

    const timeout = setTimeout(() => {
      if (registerErrorPending.includes(WAITING_LIMIT_MESSAGE)) {
        setLimitVisible(true);
      } else {
        setRegisterErrorMessage(registerErrorPending);
      }
      setRegisterErrorPending(null);
    }, 260);

    return () => {
      clearTimeout(timeout);
    };
  }, [confirmVisible, registerErrorPending]);

  function openRegisterErrorDialog(message: string) {
    setRegisterErrorMessage(null);
    setLimitVisible(false);
    setRegisterErrorPending(message);
    setConfirmVisible(false);
  }

  useEffect(() => {
    if (!sheetVisible) {
      setExpanded(false);
    }
  }, [sheetVisible]);

  useEffect(() => {
    if (!selectedBooth) {
      return;
    }

    const latest = boothDetails[selectedBooth.boothId] ?? detailMap[selectedBooth.boothId] ?? null;
    if (latest) {
      setSheetDetail(latest);
    }
  }, [boothDetails, detailMap, selectedBooth]);

  useEffect(() => {
    setMapImageUrl(eventProfile?.mapImageUrl ?? null);
  }, [eventProfile?.mapImageUrl]);

  useEffect(() => {
    if (!accessToken || !eventId || activeTab !== 'map') {
      return;
    }

    let cancelled = false;
    setMapLoadState('loading');

    async function loadEventMap() {
      try {
        const response = await fetchVisitorBoothMap(accessToken);

        if (cancelled) {
          return;
        }

        setMapImageUrl(response.mapImageUrl);
        setMapAreas(response.booths);
        setMapLoadState(response.mapImageUrl && response.booths.length ? 'ready' : 'error');
      } catch (error) {
        console.warn('행사 지도 조회 실패', error);

        if (cancelled) {
          return;
        }

        setMapAreas([]);
        setMapLoadState('error');
      }
    }

    void loadEventMap();

    return () => {
      cancelled = true;
    };
  }, [accessToken, activeTab, eventId]);

  useEffect(() => {
    if (!accessToken || booths.length === 0) {
      return;
    }

    const missingBoothIds = booths
      .map((booth) => booth.boothId)
      .filter((boothId) => !detailMap[boothId]);

    if (!missingBoothIds.length) {
      return;
    }

    let cancelled = false;

    async function hydrateBoothDetails() {
      const entries = await Promise.all(
        missingBoothIds.map(async (boothId) => {
          try {
            const detail = await fetchBoothDetail(boothId, accessToken);
            return [boothId, detail] as const;
          } catch (error) {
            console.warn('부스 상세 프리로드 실패', error);
            return null;
          }
        }),
      );

      if (cancelled) {
        return;
      }

      const nextEntries = entries.filter((entry): entry is readonly [number, BoothDetail] => !!entry);

      if (!nextEntries.length) {
        return;
      }

      setDetailMap((current) => ({
        ...current,
        ...Object.fromEntries(nextEntries),
      }));
    }

    void hydrateBoothDetails();

    return () => {
      cancelled = true;
    };
  }, [accessToken, booths, detailMap]);

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
    setExpanded(true);
    setSheetVisible(true);
    setLoadingSheet(true);
    setSheetDetail(null);
    setSheetEstimatedMinutes(null);

    try {
      const detail = await getBoothDetail(booth.boothId);
      setSheetDetail(detail);
      setDetailMap((current) => ({
        ...current,
        [booth.boothId]: detail,
      }));

      if (accessToken) {
        try {
          const expected = await fetchExpectedTime(booth.boothId, accessToken);
          setSheetEstimatedMinutes(expected.estimated_minutes);
        } catch (error) {
          console.warn('예상 대기시간 조회 실패', error);
          setSheetEstimatedMinutes(null);
        }
      } else {
        setSheetEstimatedMinutes(null);
      }
    } finally {
      setLoadingSheet(false);
    }
  }

  async function handleReserveConfirm() {
    if (!selectedBooth) {
      return;
    }

    try {
      setConfirmingReserve(true);
      await createWaiting(selectedBooth.boothId);
      setConfirmVisible(false);
      setSheetVisible(false);
      showToast({ type: 'success', message: '대기 신청이 완료되었습니다.' });
    } catch (error) {
      const message = toUserErrorMessage(error, '대기 등록에 실패했습니다.');
      openRegisterErrorDialog(message);
    } finally {
      setConfirmingReserve(false);
    }
  }

  async function handleCancelConfirm() {
    const activeWaiting = selectedBooth ? findWaitingByBoothId(selectedBooth.boothId) : null;

    if (!activeWaiting) {
      return;
    }

    try {
      setCanceling(true);
      await cancelWaiting(activeWaiting);
      setCancelVisible(false);
      setSheetVisible(false);
      showToast({ type: 'success', message: '예약이 취소되었습니다.' });
    } catch (error) {
      showToast({
        type: 'error',
        message: toUserErrorMessage(error, '예약 취소에 실패했습니다.'),
      });
    } finally {
      setCanceling(false);
    }
  }

  async function handlePostpone() {
    if (!selectedWaiting) {
      return;
    }

    try {
      await postponeWaiting(selectedWaiting);
      showToast({ type: 'success', message: '순서를 뒤로 미뤘습니다.' });
    } catch (error) {
      showToast({
        type: 'error',
        message: toUserErrorMessage(error, '순서 미루기에 실패했습니다.'),
      });
    }
  }

  const filteredBooths = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) {
      return booths;
    }

    return booths.filter((booth) => {
      const target = `${booth.name} ${booth.locationCode}`.toLowerCase();
      return target.includes(keyword);
    });
  }, [booths, searchQuery]);

  const boothWaitingCount = (boothId: number) => {
    const detail = boothDetails[boothId] ?? detailMap[boothId];

    if (detail) {
      return detail.waitingCount;
    }

    return null;
  };

  const boothMap = useMemo(
    () => Object.fromEntries(booths.map((booth) => [booth.boothId, booth])),
    [booths],
  );

  const displayMapAreas = useMemo(
    () =>
      mapAreas.map((area) => ({
        ...area,
        waitingCount: boothWaitingCount(area.boothId) ?? area.waitingCount,
        isEmergencyClosed: boothMap[area.boothId]?.isEmergencyClosed ?? area.isEmergencyClosed,
        boothName: boothMap[area.boothId]?.name ?? area.boothName,
        locationCode: boothMap[area.boothId]?.locationCode ?? area.locationCode,
      })),
    [boothMap, mapAreas],
  );

  const filteredMapAreas = useMemo(
    () => displayMapAreas.filter((area) => filteredBooths.some((booth) => booth.boothId === area.boothId)),
    [displayMapAreas, filteredBooths],
  );

  const selectedWaiting = selectedBooth ? findWaitingByBoothId(selectedBooth.boothId) : null;

  const statusSummary = booths.reduce(
    (accumulator, booth) => {
      const congestion = getBoothCongestion(boothWaitingCount(booth.boothId), booth.isEmergencyClosed);

      if (congestion.tone === 'smooth') {
        accumulator.smooth += 1;
      } else if (congestion.tone === 'normal') {
        accumulator.normal += 1;
      } else if (congestion.tone === 'busy') {
        accumulator.busy += 1;
      }

      return accumulator;
    },
    { smooth: 0, normal: 0, busy: 0 },
  );

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderCopy}>
              <Text style={styles.pageTitle}>배치도</Text>
            </View>
            <Pressable style={styles.iconButton}>
              <Feather color={palette.text} name="bell" size={24} />
            </Pressable>
          </View>

          <View style={styles.tabRow}>
            {mapTabs.map((tab) => {
              const active = activeTab === tab.key;

              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tabButton, active ? styles.tabButtonActive : null]}
                >
                  <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {lastError ? <ErrorBanner message={lastError} /> : null}

          {filteredBooths.length ? (
            activeTab === 'map' ? (
              mapLoadState === 'ready' && mapImageUrl && filteredMapAreas.length ? (
                <EventMapCanvas
                  areas={filteredMapAreas}
                  boothMap={boothMap}
                  imageUrl={mapImageUrl}
                  onPressArea={(booth) => {
                    void openBoothSheet(booth);
                  }}
                  selectedBoothId={selectedBooth?.boothId ?? null}
                />
              ) : (
                <View style={styles.mapBoard}>
                  <View style={styles.grid}>
                    {filteredBooths.map((booth) => (
                      <BoothTile
                        booth={booth}
                        key={booth.boothId}
                        onPress={() => {
                          void openBoothSheet(booth);
                        }}
                        selected={selectedBooth?.boothId === booth.boothId}
                        waitingCount={boothWaitingCount(booth.boothId)}
                      />
                    ))}
                  </View>
                </View>
              )
            ) : (
              <>
                <View style={styles.searchCard}>
                  <View style={styles.searchInputWrap}>
                    <Feather color={palette.textMuted} name="search" size={18} />
                    <TextInput
                      onChangeText={setSearchQuery}
                      placeholder="부스명 또는 위치 코드로 검색"
                      placeholderTextColor={palette.textMuted}
                      style={styles.searchInput}
                      value={searchQuery}
                    />
                    {searchQuery ? (
                      <Pressable onPress={() => setSearchQuery('')} style={styles.searchClear}>
                        <Feather color={palette.textMuted} name="x" size={16} />
                      </Pressable>
                    ) : null}
                  </View>
                  <Text style={styles.searchHint}>
                    {filteredBooths.length}개 부스가 검색되었습니다.
                  </Text>
                </View>

                <View style={styles.legendCard}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: palette.success }]} />
                    <Text style={styles.legendText}>원활 {statusSummary.smooth}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: palette.warning }]} />
                    <Text style={styles.legendText}>보통 {statusSummary.normal}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: palette.danger }]} />
                    <Text style={styles.legendText}>혼잡 {statusSummary.busy}</Text>
                  </View>
                </View>

                <View style={styles.list}>
                  {filteredBooths.map((booth) => (
                    <BoothListCard
                      booth={booth}
                      boothDetail={boothDetails[booth.boothId] ?? detailMap[booth.boothId]}
                      key={booth.boothId}
                      onPress={() => {
                        void openBoothSheet(booth);
                      }}
                      selected={selectedBooth?.boothId === booth.boothId}
                      waitingCount={boothWaitingCount(booth.boothId)}
                    />
                  ))}
                </View>
              </>
            )
          ) : (
            <EmptyState caption="현재 불러온 부스가 없습니다." title="배치도 데이터 없음" />
          )}
        </ScrollView>

        <BoothBottomSheet
          booth={selectedBooth}
          detail={sheetDetail}
          estimatedMinutes={sheetEstimatedMinutes}
          expanded={expanded}
          activeWaiting={selectedWaiting}
          loading={loadingSheet}
          onCancel={() => setCancelVisible(true)}
          onClose={() => setSheetVisible(false)}
          onExpandToggle={() => setExpanded((current) => !current)}
          onPostpone={() => void handlePostpone()}
          onReserve={() => {
            if (selectedBooth) {
              setConfirmVisible(true);
            }
          }}
          visible={sheetVisible && !!selectedBooth}
        />

        <ReservationConfirmSheet
          boothName={selectedBooth?.name ?? ''}
          confirming={confirmingReserve}
          estimatedMinutes={sheetEstimatedMinutes}
          locationCode={selectedBooth?.locationCode ?? ''}
          onClose={() => setConfirmVisible(false)}
          onConfirm={() => {
            void handleReserveConfirm();
          }}
          visible={confirmVisible && !!selectedBooth}
          waitingCount={sheetDetail?.waitingCount ?? boothWaitingCount(selectedBooth?.boothId ?? -1)}
        />

        <ConfirmDialog
          body={`${selectedBooth?.name ?? '이 부스'} 예약을 취소할까요? 취소 후에는 다시 대기를 등록해야 합니다.`}
          confirmLabel="예약 취소하기"
          confirming={canceling}
          onClose={() => setCancelVisible(false)}
          onConfirm={() => {
            void handleCancelConfirm();
          }}
          title="예약을 취소할까요?"
          visible={cancelVisible && !!selectedWaiting}
        />

        <ConfirmDialog
          body={WAITING_LIMIT_MESSAGE}
          confirmLabel="확인"
          hideCancel
          onClose={() => setLimitVisible(false)}
          onConfirm={() => setLimitVisible(false)}
          title="대기 등록 제한"
          visible={limitVisible}
        />

        <ConfirmDialog
          body={registerErrorMessage ?? ''}
          confirmLabel="확인"
          hideCancel
          onClose={() => setRegisterErrorMessage(null)}
          onConfirm={() => setRegisterErrorMessage(null)}
          title="대기 등록 실패"
          visible={!!registerErrorMessage}
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
    paddingTop: 24,
    gap: 18,
    paddingBottom: 148,
  },
  pageHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  pageHeaderCopy: {
    gap: 4,
  },
  pageTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '900',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCard: {
    marginHorizontal: 20,
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: palette.surfaceAlt,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchClear: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchHint: {
    color: palette.textMuted,
    fontSize: 12,
  },
  tabRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingBottom: 12,
  },
  tabButton: {
    paddingVertical: 6,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: palette.text,
  },
  tabLabel: {
    color: palette.textMuted,
    fontSize: 16,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: palette.text,
  },
  legendCard: {
    marginHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: palette.surface,
    borderRadius: 22,
    padding: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
  },
  mapBoard: {
    backgroundColor: '#D9D9D9',
  },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  list: {
    paddingHorizontal: 20,
    gap: 14,
  },
});
