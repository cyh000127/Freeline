import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';

import BottomTabBar, { type TabKey } from '@/components/navigation/BottomTabBar';

const TAB_ROUTES: Record<TabKey, '/home' | '/reservation' | '/maps' | '/my' | '/search'> =
  {
    home: '/home',
    reservation: '/reservation',
    map: '/maps',
    my: '/my',
    search: '/search',
  };

export default function MapsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'map' | 'list'>('map');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>배치도</Text>

          <Pressable
            style={styles.iconButton}
            onPress={() => {
              // router.push('/notifications');
            }}
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

        <View style={styles.body}>
          <View style={styles.mockContent}>
            <Text style={styles.mockText}>
              {tab === 'map' ? 'MAP VIEW' : 'LIST VIEW'}
            </Text>
          </View>

          <Pressable
            style={styles.button}
            onPress={() => router.push('/reservation_flow')}
          >
            <Text style={styles.buttonText}>새로 예약하기</Text>
          </Pressable>
        </View>
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

  mockContent: {
    flex: 1,
  },

  mockText: {
    fontSize: 16,
    color: '#000000',
  },

  button: {
    marginHorizontal: 20,
    marginBottom: 20,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#34314C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
