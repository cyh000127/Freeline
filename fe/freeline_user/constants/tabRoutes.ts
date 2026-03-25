import type { TabKey } from '@/components/navigation/BottomTabBar';

export const TAB_ROUTES: Record<
  TabKey,
  '/home' | '/reservation' | '/maps' | '/my' | '/search'
> = {
  home: '/home',
  reservation: '/reservation',
  map: '/maps',
  my: '/my',
  search: '/search',
};
