import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { TAB_ROUTES } from '@/constants/tabRoutes';
import { useAuthSession } from '@/features/auth/auth-session.context';
import { getEventBooths } from '@/features/booth/booth.api';
import type { EventBoothItem } from '@/features/booth/types';
import { getEventDetail } from '@/features/event/event.api';
import type { EventDetail } from '@/features/event/types';
import BoothListSection from '@/components/booth/BoothListSection';

type MapTab = 'map' | 'list';

export default function MapsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { accessToken, eventId } = useAuthSession();

  const [tab, setTab] = useState<MapTab>(params.tab === 'list' ? 'list' : 'map');
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [booths, setBooths] = useState<EventBoothItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.tab === 'list') {
      setTab('list');
    }
  }, [params.tab]);

  const loadData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [eventData, boothData] = await Promise.all([
        getEventDetail(accessToken),
        getEventBooths(accessToken, eventId ?? 1),
      ]);

      setEventDetail(eventData);
      setBooths(boothData);
    } catch (loadError) {
      console.error('배치도 화면 데이터 조회 실패:', loadError);
      setError('배치도 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, eventId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const openBoothDetail = (boothId: number) => {
    router.push({
      pathname: '/reservation_flow/[boothId]',
      params: { boothId: String(boothId) },
    });
  };

  const mapSource = useMemo(() => {
    return eventDetail?.mapImageUrl ? { uri: eventDetail.mapImageUrl } : null;
  }, [eventDetail]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>배치도</Text>

          <Pressable
            style={styles.iconButton}
            onPress={() => router.push('/notifications')}
          >
            <Image
              source={require('@/assets/icons/notifications.png')}
              style={styles.icon}
              resizeMode="contain"
            />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <Pressable onPress={() => setTab('map')} style={styles.tabButton}>
            <Text style={tab === 'map' ? styles.activeTabText : styles.inactiveTabText}>
              부스 배치도
            </Text>
          </Pressable>

          <Pressable onPress={() => setTab('list')} style={styles.tabButton}>
            <Text style={tab === 'list' ? styles.activeTabText : styles.inactiveTabText}>
              부스 목록
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#34314C" style={styles.loader} />
          ) : error ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : tab === 'map' ? (
            <View style={styles.mapSection}>
              {mapSource ? (
                <Image source={mapSource} style={styles.mapImage} resizeMode="contain" />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapPlaceholderTitle}>배치도 이미지 없음</Text>
                  <Text style={styles.mapPlaceholderSub}>
                    현재 행사에 업로드된 배치도 이미지가 없습니다.
                  </Text>
                </View>
              )}

              <Pressable
                style={styles.inlineButton}
                onPress={() => setTab('list')}
              >
                <Text style={styles.inlineButtonText}>부스 목록으로 보기</Text>
              </Pressable>
            </View>
          ) : (
            <BoothListSection
              booths={booths}
              emptyText="현재 예약 가능한 부스가 없습니다."
              onBoothPress={openBoothDetail}
            />
          )}
        </ScrollView>
      </View>

      <BottomTabBar
        activeTab="map"
        onTabPress={(pressedTab) => router.replace(TAB_ROUTES[pressedTab])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  iconButton: {
    padding: 4,
  },
  icon: {
    width: 30,
    height: 30,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  tabButton: {
    marginRight: 20,
  },
  activeTabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  inactiveTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A6A1AE',
  },
  body: {
    flex: 1,
    paddingBottom: 118,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loader: {
    marginTop: 40,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  mapSection: {
    gap: 16,
  },
  mapImage: {
    width: '100%',
    height: 420,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  mapPlaceholder: {
    minHeight: 320,
    backgroundColor: '#F7F4FF',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2F2C48',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  mapPlaceholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2F2C48',
    marginBottom: 8,
  },
  mapPlaceholderSub: {
    fontSize: 14,
    color: '#5C5A72',
    fontWeight: '600',
    textAlign: 'center',
  },
  inlineButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#34314C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
