import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { TAB_ROUTES } from '@/constants/tabRoutes';
import { useAuthSession } from '@/features/auth/auth-session.context';
import { getEventBooths } from '@/features/booth/booth.api';
import type { EventBoothItem } from '@/features/booth/types';
import BoothListSection from '@/components/booth/BoothListSection';

export default function Search() {
  const router = useRouter();
  const { accessToken, eventId } = useAuthSession();

  const [keyword, setKeyword] = useState('');
  const [booths, setBooths] = useState<EventBoothItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooths = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getEventBooths(accessToken, eventId ?? 1);
      setBooths(data);
    } catch (loadError) {
      console.error('검색용 부스 목록 조회 실패:', loadError);
      setError('부스 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, eventId]);

  useEffect(() => {
    void loadBooths();
  }, [loadBooths]);

  const filteredBooths = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();

    if (!normalized) {
      return booths;
    }

    return booths.filter((booth) => {
      return (
        booth.name.toLowerCase().includes(normalized) ||
        booth.locationCode.toLowerCase().includes(normalized)
      );
    });
  }, [booths, keyword]);

  const handleOpenBooth = (boothId: number) => {
    router.push({
      pathname: '/reservation_flow/[boothId]',
      params: { boothId: String(boothId) },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>부스 검색</Text>
        <Text style={styles.description}>
          부스명이나 위치 코드를 검색해 빠르게 상세 화면으로 이동하세요.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="부스명 또는 위치 코드를 입력하세요"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#34314C" style={styles.loader} />
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => void loadBooths()}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <BoothListSection
            booths={filteredBooths}
            emptyText={
              keyword.trim().length > 0
                ? '검색 결과가 없습니다.'
                : '현재 조회할 수 있는 부스가 없습니다.'
            }
            onBoothPress={handleOpenBooth}
          />
        )}
      </ScrollView>

      <BottomTabBar
        activeTab="search"
        onTabPress={(tab) => router.replace(TAB_ROUTES[tab])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 130,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
  },
  description: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },
  searchBox: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111111',
  },
  loader: {
    marginTop: 30,
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
    lineHeight: 20,
    color: '#888888',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: '#34314C',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
