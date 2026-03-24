import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import TabBarItem from './TabBarItem';
import TabBarIcon from './TabBarIcon';

export type TabKey = 'home' | 'reservation' | 'map' | 'my' | 'search';

type BottomTabBarProps = {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
};

const mainTabs: {
  key: Exclude<TabKey, 'search'>;
  label: string;
}[] = [
  { key: 'home', label: '홈' },
  { key: 'reservation', label: '예약 관리' },
  { key: 'map', label: '배치도' },
  { key: 'my', label: 'MY' },
];

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.mainContainer}>
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <TabBarItem
                key={tab.key}
                label={tab.label}
                isActive={isActive}
                onPress={() => onTabPress(tab.key)}
                icon={<TabBarIcon tab={tab.key} isActive={isActive} />}
              />
            );
          })}
        </View>

        <Pressable style={styles.searchButton} onPress={() => onTabPress('search')}>
          <TabBarIcon tab="search" isActive={false} />
        </Pressable>
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
    pointerEvents: 'box-none',
  },

  row: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mainContainer: {
    flex: 1,
    height: 60,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(160, 158, 171, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,

    boxShadow: '0px 6px 12px rgba(0,0,0,0.12)',
    elevation: 10,
  },

  searchButton: {
    width: 60,
    height: 60,
    borderRadius: 36,
    backgroundColor: 'rgba(184, 184, 195, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',

    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.12)',
    elevation: 10,
  },
});
