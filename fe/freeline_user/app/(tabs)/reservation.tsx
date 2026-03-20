import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';
import ReservationCard from '@/components/reservation/ReservationCard';
import ReservationCardExpandable from '@/components/reservation/ReservationCardExpandable';
import ReservationFilterTabs, {
  ReservationFilter,
} from '@/components/reservation/ReservationFilterTabs';
import { useQRMock } from '@/app/contexts/QRMockContext';

const TAB_ROUTES: Record<TabKey, '/home' | '/reservation' | '/map' | '/my' | '/search'> =
  {
    home: '/home',
    reservation: '/reservation',
    map: '/map',
    my: '/my',
    search: '/search',
  };

type ReservationStatus =
  | 'waiting'
  | 'called'
  | 'registered'
  | 'entered'
  | 'completed'
  | 'canceled'
  | 'autocanceled';

type ReservationViewItem = {
  waitingId: string;
  boothName: string;
  myRank?: number;
  estimatedWaitText?: string;
  boothLocation?: string;
  reservedAt?: string;
  notice?: string;
  status: ReservationStatus;
};

function mapMockToReservationStatus(verificationState?: string): ReservationStatus {
  if (verificationState === 'done') return 'registered';
  if (verificationState === 'on') return 'called';
  return 'waiting';
}

function getCompactStatusUI(status: ReservationStatus) {
  switch (status) {
    case 'called':
      return {
        statusLabel: '호출됨' as const,
        statusTone: 'yellow' as const,
        actionLabel: 'QR 인증' as const,
        actionTone: 'yellow' as const,
      };
    case 'registered':
      return {
        statusLabel: '등록 완료' as const,
        statusTone: 'green' as const,
      };
    case 'entered':
      return {
        statusLabel: '입장 완료' as const,
        statusTone: 'green' as const,
      };
    case 'completed':
      return {
        statusLabel: '완료' as const,
        statusTone: 'green' as const,
      };
    case 'canceled':
      return {
        statusLabel: '예약 취소' as const,
        statusTone: 'gray' as const,
      };
    case 'autocanceled':
      return {
        statusLabel: '자동 취소' as const,
        statusTone: 'red' as const,
      };
    case 'waiting':
    default:
      return {
        statusLabel: '정상 대기 중' as const,
        statusTone: 'blue' as const,
      };
  }
}

function isFinishedStatus(status: ReservationStatus) {
  return status === 'completed' || status === 'canceled' || status === 'autocanceled';
}

export default function ReservationScreen() {
  const router = useRouter();
  const { waitings } = useQRMock();
  const [filter, setFilter] = useState<ReservationFilter>('all');

  const handleTabPress = (tab: TabKey) => {
    router.replace(TAB_ROUTES[tab]);
  };

  const currentItems = useMemo<ReservationViewItem[]>(() => {
    return waitings.map((item) => {
      const status = mapMockToReservationStatus(item.verificationState);

      return {
        waitingId: item.waitingId,
        boothName: item.boothName,
        myRank: item.myRank,
        estimatedWaitText:
          status === 'registered'
            ? '도착 인증 완료'
            : typeof item.myRank === 'number'
              ? '약 25분'
              : undefined,
        boothLocation: 'A-12',
        reservedAt: '2026.03.06 14:30',
        notice:
          status === 'called'
            ? '지금 도착 인증이 가능합니다.'
            : '아직 도착 인증 가능 상태가 아닙니다.',
        status,
      };
    });
  }, [waitings]);

  const finishedItems = useMemo<ReservationViewItem[]>(
    () => [
      {
        waitingId: 'history-1',
        boothName: 'LG CNS',
        status: 'completed',
        estimatedWaitText: '입장 완료',
        reservedAt: '2026.03.05 15:10',
      },
      {
        waitingId: 'history-2',
        boothName: '한화',
        status: 'autocanceled',
        estimatedWaitText: '자동 취소됨',
        reservedAt: '2026.03.05 16:00',
      },
    ],
    [],
  );

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

    return (
      <ReservationCardExpandable
        item={item}
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
        onCancelPress={() => {
          console.log('cancel reservation', item.waitingId);
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

          <Pressable style={styles.iconButton} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={24} color="#222222" />
          </Pressable>
        </View>

        <ReservationFilterTabs value={filter} onChange={setFilter} />

        {mergedItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>현재 예약된 부스가 없습니다.</Text>
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
  },
});
