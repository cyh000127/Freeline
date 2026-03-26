import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useAppData } from '@/features/app-data/context';
import { useTracking } from '@/features/tracking/tracking.context';
import { usePageTracking } from '@/features/tracking/use-page-tracking';
import { palette } from '@/theme/colors';

export default function SearchScreen() {
  usePageTracking('search');
  const [query, setQuery] = useState('');
  const { booths, selectBooth } = useAppData();
  const { trackEvent } = useTracking();

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) {
      return booths;
    }

    return booths.filter(
      (booth) =>
        booth.name.toLowerCase().includes(keyword) ||
        booth.locationCode.toLowerCase().includes(keyword),
    );
  }, [booths, query]);

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>부스 검색</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.close}>닫기</Text>
          </Pressable>
        </View>

        <TextField
          autoFocus
          onChangeText={setQuery}
          placeholder="부스명 또는 위치 코드"
          value={query}
        />

        <View style={styles.list}>
          {results.map((booth) => (
            <Pressable
              key={booth.boothId}
              onPress={() => {
                trackEvent({
                  action: 'MAP_INTERACTION',
                  targetType: 'BOOTH',
                  targetId: String(booth.boothId),
                  metadata: {
                    interaction: 'search_select',
                    query: query.trim(),
                    booth_name: booth.name,
                    location_code: booth.locationCode,
                  },
                });
                selectBooth(booth.boothId);
                router.replace('/(tabs)/map');
              }}
              style={styles.item}
            >
              <Text style={styles.itemTitle}>{booth.name}</Text>
              <Text style={styles.itemMeta}>{booth.locationCode}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.text,
  },
  close: {
    color: palette.ink,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  item: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.text,
  },
  itemMeta: {
    color: palette.textMuted,
  },
});
