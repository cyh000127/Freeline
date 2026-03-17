import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';

export type TabKey = 'home' | 'reservation' | 'map' | 'my' | 'search';

type BottomTabBarProps = {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
};

const tabs: {
  key: TabKey;
  label: string;
  icon: any;
}[] = [
  {
    key: 'home',
    label: '홈',
    icon: require('@/assets/icons/home.png'),
  },
  {
    key: 'reservation',
    label: '예약 관리',
    icon: require('@/assets/icons/reservation.png'),
  },
  {
    key: 'map',
    label: '배치도',
    icon: require('@/assets/icons/map.png'),
  },
  {
    key: 'my',
    label: 'MY',
    icon: require('@/assets/icons/my.png'),
  },
  {
    key: 'search',
    label: '',
    icon: require('@/assets/icons/search.png'),
  },
];

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isSearch = tab.key === 'search';

          if (isSearch) {
            return (
              <Pressable
                key={tab.key}
                style={styles.searchButton}
                onPress={() => onTabPress(tab.key)}
              >
                <Image source={tab.icon} style={styles.searchIcon} />
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => onTabPress(tab.key)}
            >
              <Image
                source={tab.icon}
                style={[styles.icon, isActive && styles.activeIcon]}
              />
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: 'center',
  },

  container: {
    width: '90%',
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(160, 158, 171, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  tabButton: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },

  activeTabButton: {
    backgroundColor: '#A09EAB',
  },

  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    marginBottom: 2,
    opacity: 0.92,
  },

  activeIcon: {
    opacity: 1,
  },

  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  activeLabel: {
    color: '#FFFFFF',
  },

  searchButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#B8B8C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  searchIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
