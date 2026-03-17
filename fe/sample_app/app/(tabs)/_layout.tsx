import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="reservation" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="my" />
      <Tabs.Screen name="search" />
    </Tabs>
  );
}
