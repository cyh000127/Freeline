import { Image, Pressable, StyleSheet, View } from 'react-native';
import TabBarItem from './TabBarItem';

export type MainTabKey = 'home' | 'reservation' | 'map' | 'my';
export type TabKey = MainTabKey | 'search';

type BottomTabBarProps = {
  activeTab: TabKey;
  onTabPress?: (tab: TabKey) => void;
};

const TRANSLUCENT = 'rgba(160, 158, 171, 0.6)';

export default function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.mainTabs}>
          <TabBarItem
            label="홈"
            isActive={activeTab === 'home'}
            onPress={() => onTabPress?.('home')}
            icon={
              <Image source={require('@/assets/icons/home.png')} style={styles.icon} />
            }
          />
          <TabBarItem
            label="예약 관리"
            isActive={activeTab === 'reservation'}
            onPress={() => onTabPress?.('reservation')}
            icon={
              <Image
                source={require('@/assets/icons/reservation.png')}
                style={styles.icon}
              />
            }
          />
          <TabBarItem
            label="배치도"
            isActive={activeTab === 'map'}
            onPress={() => onTabPress?.('map')}
            icon={
              <Image source={require('@/assets/icons/map.png')} style={styles.icon} />
            }
          />
          <TabBarItem
            label="MY"
            isActive={activeTab === 'my'}
            onPress={() => onTabPress?.('my')}
            icon={<Image source={require('@/assets/icons/my.png')} style={styles.icon} />}
          />
        </View>

        <Pressable style={styles.searchButton} onPress={() => onTabPress?.('search')}>
          <Image
            source={require('@/assets/icons/search.png')}
            style={styles.searchIcon}
          />
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
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainTabs: {
    flex: 1,
    height: 60,
    borderRadius: 999,
    backgroundColor: TRANSLUCENT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchButton: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: TRANSLUCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  searchIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
});
