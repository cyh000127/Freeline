import { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TAB_ROUTES } from '@/constants/tabRoutes';
import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';
import ReservationCard from '@/components/reservation/ReservationCard';
import ReservationCardExpandable from '@/components/reservation/ReservationCardExpandable';
import ReservationFilterTabs, {
  ReservationFilter,
} from '@/components/reservation/ReservationFilterTabs';
import {
  getMyWaitings,
  createWaiting,
  cancelWaiting,
  postponeWaiting,
  exitWaiting,
} from '@/features/waiting/waiting.api';
import { useAuthSession } from '@/features/auth/auth-session.context';
import type { WaitingItem, WaitingStatus } from '@/features/waiting/types';

type ReservationStatus = WaitingStatus;

type ReservationViewItem = {
  waitingId: string;
  boothName: string;
  myRank?: number;
  estimatedWaitText?: string;
  boothLocation?: string;
  reservedAt?: string;
  notice?: string;
  canPostpone?: boolean;
  status: ReservationStatus;
};

function getCompactStatusUI(status: ReservationStatus) {
  switch (status) {
    case 'CALLED':
      return {
        statusLabel: '호출됨' as const,
        statusTone: 'yellow' as const,
        actionLabel: 'QR 인증' as const,
        actionTone: 'yellow' as const,
      };
    case 'REGISTERED':
      return {
        statusLabel: '도착 인증 완료' as const,
        statusTone: 'green' as const,
      };
    case 'ENTERED':
      return {
        statusLabel: '입장 완료' as const,
        statusTone: 'green' as const,
      };
    case 'EXITED':
      return {
        statusLabel: '이용 종료' as const,
        statusTone: 'gray' as const,
      };
    case 'CANCELED':
      return {
        statusLabel: '예약 취소' as const,
        statusTone: 'gray' as const,
      };
    case 'EXPIRED':
      return {
        statusLabel: '자동 취소' as const,
        statusTone: 'red' as const,
      };
    case 'WAITING':
    default:
      return {
        statusLabel: '정상 대기 중' as const,
        statusTone: 'blue' as const,
      };
  }
}

function isFinishedStatus(status: ReservationStatus) {
  return status === 'EXITED' || status === 'CANCELED' || status === 'EXPIRED';
}

export default function ReservationScreen() {
  const router = useRouter();

  const [waitings, setWaitings] = useState<WaitingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReservationFilter>('all');

  const [creating, setCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const { accessToken } = useAuthSession();

  const handleTabPress = (tab: TabKey) => {
    router.replace(TAB_ROUTES[tab]);
  };

  const loadWaitings = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getMyWaitings(accessToken);
      setWaitings(data.waitings);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '대기 목록을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReservation = async (boothId: number) => {
    if (!accessToken) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      setCreating(true);
      await createWaiting(accessToken, boothId);
      await loadWaitings();
      Alert.alert('예약 완료', '예약이 추가되었습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '예약 추가에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelReservation = async (waitingId: number) => {
    if (!accessToken) return;
    try {
      setActionLoadingId(waitingId);
      await cancelWaiting(accessToken, waitingId);
      await loadWaitings();
      Alert.alert('예약 취소', '예약이 취소되었습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '예약 취소에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePostponeReservation = async (waitingId: number) => {
    if (!accessToken) return;
    try {
      setActionLoadingId(waitingId);
      await postponeWaiting(accessToken, waitingId);
      await loadWaitings();
      Alert.alert('미루기 완료', '예약이 미뤄졌습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '예약 미루기에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setActionLoadingId(null);
    }
  };
  const handleExitReservation = async (waitingId: number) => {
    if (!accessToken) return;
    try {
      setActionLoadingId(waitingId);
      await exitWaiting(accessToken, waitingId);
      await loadWaitings();
      Alert.alert('이용 종료', '체험이 종료 처리되었습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '이용 종료에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    loadWaitings();
  }, []);

  const currentItems = useMemo<ReservationViewItem[]>(() => {
    return waitings
      .filter((item) => !isFinishedStatus(item.status))
      .map((item) => {
        const status = item.status;

        return {
          waitingId: String(item.waiting_id),
          boothName: item.booth_name,
          myRank: item.my_rank,
          estimatedWaitText:
            status === 'REGISTERED' ? '도착 인증 완료' : undefined,
          boothLocation: undefined,
          reservedAt: undefined,
          notice:
            status === 'CALLED'
              ? '지금 도착 인증이 가능합니다.'
              : status === 'ENTERED'
                ? '현재 체험이 진행 중입니다. 체험이 끝나면 이용 종료를 눌러 주세요.'
                : '아직 도착 인증 가능 상태가 아닙니다.',
          canPostpone: item.postpone_available,
          status,
        };
      });
  }, [waitings]);

  const finishedItems = useMemo<ReservationViewItem[]>(() => {
    return waitings
      .filter((item) => isFinishedStatus(item.status))
      .map((item) => {
        return {
          waitingId: String(item.waiting_id),
          boothName: item.booth_name,
          status: item.status,
          estimatedWaitText: item.status === 'EXITED' ? '이용 종료' : item.status === 'CANCELED' ? '예약 취소됨' : '자동 취소됨',
          reservedAt: undefined,
        };
      });
  }, [waitings]);

  const mergedItems = useMemo(() => {
    if (filter === 'current') return currentItems;
    if (filter === 'finished') return finishedItems;
    return [...currentItems, ...finishedItems];
  }, [filter, currentItems, finishedItems]);

  const renderReservationItem = (item: ReservationViewItem) => {
    if (isFinishedStatus(item.status)) {
      const ui = getCompactStatusUI(item.status);

      return (
        <ReservationCard
          boothName={item.boothName}
          myOrderText={typeof item.myRank === 'number' ? `${item.myRank}번째` : undefined}
          estimatedWaitText={item.estimatedWaitText}
          statusLabel={ui.statusLabel}
          statusTone={ui.statusTone}
        />
      );
    }

    const waitingIdNumber = Number(item.waitingId);
    const isActionLoading = actionLoadingId === waitingIdNumber;

    return (
      <ReservationCardExpandable
        item={{
          ...item,
          notice: isActionLoading ? '처리 중입니다...' : item.notice,
        }}
        onQrPress={() =>
          router.push({
            pathname: '/qr/scan',
            params: {
              waitingId: item.waitingId,
              boothName: item.boothName,
              from: 'reservation',
            },
          })
        }
        onPostponePress={() => {
          Alert.alert('순번 미루기', '현재 대기 순번을 한 칸 뒤로 미루시겠습니까?', [
            { text: '닫기', style: 'cancel' },
            {
              text: '미루기',
              onPress: () => handlePostponeReservation(waitingIdNumber),
            },
          ]);
        }}
        onCancelPress={() => {
          Alert.alert('예약 취소', '현재 예약을 취소하시겠습니까?', [
            { text: '닫기', style: 'cancel' },
            {
              text: '취소하기',
              style: 'destructive',
              onPress: () => handleCancelReservation(waitingIdNumber),
            },
          ]);
        }}
        onExitPress={() => {
          Alert.alert('이용 종료', '체험을 종료 처리하시겠습니까?', [
            { text: '닫기', style: 'cancel' },
            {
              text: '종료하기',
              onPress: () => handleExitReservation(waitingIdNumber),
            },
          ]);
        }}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>예약 내역</Text>

          <Pressable
            style={styles.iconButton}
            onPress={() => {
              router.push('/notifications');
            }}
          >
            <Image
              source={require('@/assets/icons/notifications.png')}
              style={styles.icon}
            />
          </Pressable>
        </View>

        <ReservationFilterTabs value={filter} onChange={setFilter} />

        {loading ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>불러오는 중입니다...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : mergedItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>현재 예약된 부스가 없습니다.</Text>

            <Pressable
              style={[styles.mockAddButton, creating && styles.disabledButton]}
              onPress={() => handleAddReservation(1)}
              disabled={creating}
            >
              <Text style={styles.mockAddButtonText}>
                {creating ? '추가 중...' : '임시 예약 추가'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cardList}>
            {mergedItems.map((item) => (
              <View key={item.waitingId} style={styles.cardItem}>
                {renderReservationItem(item)}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomTabBar activeTab="reservation" onTabPress={handleTabPress} />
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
    paddingTop: 14,
    paddingBottom: 130,
  },
  header: {
    marginTop: 8,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  cardList: {
    marginTop: 4,
  },
  cardItem: {
    marginBottom: 14,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888888',
    textAlign: 'center',
  },
  mockAddButton: {
    marginTop: 14,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mockAddButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
