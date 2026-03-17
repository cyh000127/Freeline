import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar from '@/components/navigation/BottomTabBar';

const TAB_ROUTES = {
  home: '/home',
  reservation: '/reservation',
  map: '/map',
  my: '/my',
  search: '/search',
} as const;

export default function Map() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Text>MAP</Text>
      </View>

      <BottomTabBar
        activeTab="map"
        onTabPress={(tab) => router.replace(TAB_ROUTES[tab])}
      />
    </View>
  );
}
