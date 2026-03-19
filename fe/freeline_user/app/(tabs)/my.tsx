import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomTabBar, { TabKey } from '@/components/navigation/BottomTabBar';

const TAB_ROUTES: Record<TabKey, '/home' | '/reservation' | '/map' | '/my' | '/search'> =
  {
    home: '/home',
    reservation: '/reservation',
    map: '/map',
    my: '/my',
    search: '/search',
  };

export default function My() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>MY</Text>
      </View>

      <BottomTabBar
        activeTab="my"
        onTabPress={(tab) => router.replace(TAB_ROUTES[tab])}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 130,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
  },
});
