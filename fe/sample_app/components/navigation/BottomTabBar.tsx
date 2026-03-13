import { StyleSheet, View, Pressable, Text } from 'react-native';
import TabBarItem from './TabBarItem';

export type MainTabKey = 'home' | 'reservation' | 'map' | 'my';
export type TabKey = MainTabKey | 'search';

type BottomTabBarProps = {
  activeTab: TabKey;
  onTabPress?: (tab: TabKey) => void;
};

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.mainTabs}>
          <TabBarItem
            label="홈"
            isActive={activeTab === 'home'}
            onPress={() => onTabPress?.('home')}
          />
          <TabBarItem
            label="예약관리"
            isActive={activeTab === 'reservation'}
            onPress={() => onTabPress?.('reservation')}
          />
          <TabBarItem
            label="배치도"
            isActive={activeTab === 'map'}
            onPress={() => onTabPress?.('map')}
          />
          <TabBarItem
            label="MY"
            isActive={activeTab === 'my'}
            onPress={() => onTabPress?.('my')}
          />
        </View>

        <Pressable style={styles.searchButton} onPress={() => onTabPress?.('search')}>
          <Text style={styles.searchText}>검색</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: '#F5F5F7',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainTabs: {
    flex: 1,
    minHeight: 78,
    borderRadius: 32,
    backgroundColor: '#E6E5EF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchButton: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#E6E5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
});
