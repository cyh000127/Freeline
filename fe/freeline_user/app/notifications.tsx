import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationLive } from '@/features/notification/notification-live.context';
import NotificationItem from '@/components/notification/NotificationItem';

/*
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/features/notification/notification.api';
*/

import type { NotificationItem as ApiNotification } from '@/features/notification/types';

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function getDisplayTitle(type: ApiNotification['type'], fallback: string) {
  switch (type) {
    case 'CALL':
      return '호출 알림';
    case 'ENTRY':
      return '입장 안내';
    case 'CANCEL':
      return '취소 안내';
    case 'NOTICE':
    default:
      return fallback;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { refreshKey } = useNotificationLive();

  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const hasUnread = items.some((item) => !item.isRead);

  const fetchNotifications = useCallback(async () => {
    /*
    try {
      setLoading(true);
      const data = await getNotifications();
      setItems(data.notifications);
    } catch (e) {
      console.error('알림 조회 실패:', e);
    } finally {
      setLoading(false);
    }
    */
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, refreshKey]);

  const handlePressItem = async (notificationId: number) => {
    /*
    try {
      await markNotificationAsRead(notificationId);

      setItems((prev) =>
        prev.map((item) =>
          item.notificationId === notificationId ? { ...item, isRead: true } : item,
        ),
      );
    } catch (e) {
      console.error('읽음 처리 실패:', e);
    }
    */
  };

  const handleMarkAllRead = async () => {
    /*
    try {
      await markAllNotificationsAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (e) {
      console.error('전체 읽음 실패:', e);
    }
    */
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111111" />
        </Pressable>

        <Text style={styles.title}>알림</Text>

        <Pressable
          onPress={handleMarkAllRead}
          disabled={!hasUnread}
          style={[styles.readAllButton, !hasUnread && styles.readAllButtonDisabled]}
        >
          <Text style={[styles.readAllText, !hasUnread && styles.readAllTextDisabled]}>
            모두 읽음
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.statusText}>불러오는 중...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={36} color="#A09EAB" />
          <Text style={styles.emptyTitle}>도착한 알림이 없어요</Text>
          <Text style={styles.emptyDescription}>
            새로운 알림이 오면 이곳에서 확인할 수 있어요.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <View key={item.notificationId} style={styles.itemWrap}>
              <NotificationItem
                title={getDisplayTitle(item.type, item.title)}
                message={item.content}
                timeText={formatTime(item.createdAt)}
                isRead={item.isRead}
                type={item.type}
                onPress={() => handlePressItem(item.notificationId)}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111111',
  },
  readAllButton: {
    minWidth: 68,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#ECE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readAllButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  readAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B5BD6',
  },
  readAllTextDisabled: {
    color: '#9CA3AF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  itemWrap: {
    marginBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
  },
  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#A09EAB',
    textAlign: 'center',
  },
});
