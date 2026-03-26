import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/theme/colors';
import { spacing } from '@/theme/layout';

const tabs = [
  { label: '홈', icon: 'home', href: '/(tabs)/home' },
  { label: '예약 관리', icon: 'file-text', href: '/(tabs)/reservations' },
  { label: '배치도', icon: 'map', href: '/(tabs)/map' },
  { label: 'MY', icon: 'user', href: '/(tabs)/my' },
] as const;

export function FloatingTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <Pressable
              key={tab.href}
              onPress={() => router.replace(tab.href)}
              style={[styles.item, active ? styles.activeItem : null]}
            >
              <Feather color={active ? palette.ink : '#FFFFFF'} name={tab.icon} size={20} />
              <Text style={[styles.label, active ? styles.activeLabel : null]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.page,
    right: spacing.page,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.ink,
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: spacing.navHeight,
  },
  item: {
    flex: 1,
    minHeight: 60,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  activeItem: {
    backgroundColor: palette.lime,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  activeLabel: {
    color: palette.ink,
  },
});
