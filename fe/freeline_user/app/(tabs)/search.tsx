import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar from '@/components/navigation/BottomTabBar';
import { TAB_ROUTES } from '@/constants/tabRoutes';

export default function Search() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.screen}>
        <Text>search</Text>
      </View>

      <BottomTabBar
        activeTab="search"
        onTabPress={(tab) => router.replace(TAB_ROUTES[tab])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
});
