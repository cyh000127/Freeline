import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthSession } from '@/features/auth/auth-session.context';
import { getEventBooths } from '@/features/booth/booth.api';
import type { EventBoothItem } from '@/features/booth/types';
import ReservationCard from '@/components/reservation/ReservationCard';

// MOCK Event ID for MVP as requested by user
const TEST_EVENT_ID = 5;

export default function BoothListScreen() {
  const router = useRouter();
  const { accessToken } = useAuthSession();
  
  const [booths, setBooths] = useState<EventBoothItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBooths() {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const data = await getEventBooths(accessToken, TEST_EVENT_ID);
        setBooths(data);
      } catch (err) {
        console.error('부스 목록 불러오기 실패:', err);
        setError('부스 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBooths();
  }, [accessToken]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#111111" />
        </Pressable>
        <Text style={styles.title}>부스 목록</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>원하시는 부스를 선택하여 예약해주세요.</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#34314C" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : booths.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>현재 예약할 수 있는 부스가 없습니다.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {booths.map((booth) => (
              <ReservationCard
                key={booth.boothId}
                boothName={booth.name}
                statusLabel={booth.isEmergencyClosed ? '긴급 마감' : '예약 가능'}
                statusTone={booth.isEmergencyClosed ? 'red' : 'green'}
                showDivider={true}
              >
                <View style={styles.cardActions}>
                  <Text style={styles.boothLocation}>위치: {booth.locationCode}</Text>
                  
                  <Pressable
                    style={[
                      styles.reserveButton,
                      booth.isEmergencyClosed && styles.reserveButtonDisabled
                    ]}
                    disabled={booth.isEmergencyClosed}
                    onPress={() =>
                      router.push({
                        pathname: '/reservation_flow/[boothId]',
                        params: { boothId: booth.boothId },
                      })
                    }
                  >
                    <Text style={styles.reserveButtonText}>예약하기</Text>
                  </Pressable>
                </View>
              </ReservationCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F7F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E4E8',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  description: {
    fontSize: 15,
    color: '#444',
    marginBottom: 20,
    fontWeight: '500',
  },
  list: {
    gap: 16,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  boothLocation: {
    fontSize: 14,
    color: '#D7FF2F',
    fontWeight: '600',
  },
  reserveButton: {
    backgroundColor: '#34314C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reserveButtonDisabled: {
    backgroundColor: '#A6A1AE',
  },
  reserveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
