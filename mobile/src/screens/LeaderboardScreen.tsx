import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useTheme } from '../utils/theme';
import api from '../api/client';

const TABS = ['GLOBAL', 'KILLRACE', 'RESURGENCE', 'BATTLE_ROYALE'];

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [tab, setTab] = useState('GLOBAL');
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const url = tab === 'GLOBAL' ? '/leaderboard/global' : `/leaderboard/${tab}`;
      const res = await api.get(url);
      setData(res.data);
    } catch {}
  }, [tab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  function getRankDisplay(rank: number, t: any) {
    if (rank === 1) return { icon: '🥇', color: t.gold };
    if (rank === 2) return { icon: '🥈', color: t.silver };
    if (rank === 3) return { icon: '🥉', color: t.bronze };
    return { icon: `#${rank}`, color: t.textMuted };
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'GLOBAL' ? '🌍 Global' : t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        renderItem={({ item, index }) => {
          const rd = getRankDisplay(item.rank || index + 1, theme);
          return (
            <View style={[styles.row, item.rank === 1 && styles.rowGold]}>
              <View style={[styles.rankCircle, { backgroundColor: rd.color + '20' }]}>
                <Text style={[styles.rankText, { color: rd.color }]}>{rd.icon}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.pseudo}>{item.pseudo}</Text>
                <Text style={styles.rankTitle}>{item.rankTitle || 'COMPETITOR'}</Text>
              </View>
              <View style={styles.scoreBlock}>
                <Text style={styles.score}>{(item.xp || item.score || 0).toLocaleString()}</Text>
                <Text style={styles.scoreLabel}>pts</Text>
              </View>
            </View>
          );
        }}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>No rankings yet. Play matches to appear!</Text>}
      />
    </View>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  title: { fontSize: 26, fontWeight: '900', color: t.text, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, letterSpacing: -0.5 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: t.surface },
  tabActive: { backgroundColor: t.primary },
  tabText: { fontSize: 12, color: t.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: t.border },
  rowGold: { backgroundColor: 'rgba(251,191,36,0.06)', borderColor: t.gold + '40' },
  rankCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 16, fontWeight: '900' },
  userInfo: { flex: 1 },
  pseudo: { fontSize: 15, fontWeight: '700', color: t.text },
  rankTitle: { fontSize: 10, color: t.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreBlock: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: '900', color: t.primaryLight },
  scoreLabel: { fontSize: 9, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { color: t.textMuted, textAlign: 'center', marginTop: 60, fontSize: 14, paddingHorizontal: 20 },
});
