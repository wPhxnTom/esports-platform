import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTheme } from '../utils/theme';
import api from '../api/client';

const MODE_ICONS: Record<string, string> = { KILLRACE: '⚔️', RESURGENCE: '🔄', BATTLE_ROYALE: '👑' };

export default function HistoryScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [history, setHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const r = await api.get('/matches/history?limit=50'); setHistory(r.data.data || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  const wins = history.filter((h) => h.won).length;
  const losses = history.filter((h) => !h.won).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Match History</Text>
        {history.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryWin}>{wins}W</Text>
            <Text style={styles.summaryDash}>-</Text>
            <Text style={styles.summaryLoss}>{losses}L</Text>
          </View>
        )}
      </View>

      <FlatList
        data={history}
        renderItem={({ item, index }) => (
          <View style={[styles.card, item.won && styles.cardWin]}>
            <View style={styles.cardLeft}>
              <View style={[styles.numBadge, { backgroundColor: item.won ? theme.success + '25' : theme.error + '25' }]}>
                <Text style={[styles.numText, { color: item.won ? theme.success : theme.error }]}>{index + 1}</Text>
              </View>
            </View>
            <Text style={styles.cardIcon}>{MODE_ICONS[item.gameMode] || '🎮'}</Text>
            <View style={styles.cardCenter}>
              <Text style={styles.cardMode}>{item.gameMode}</Text>
              <Text style={styles.cardStats}>K: {item.kills} / D: {item.deaths} / Score: {item.score}</Text>
              {item.position && <Text style={styles.cardPos}>Place: #{item.position}</Text>}
            </View>
            <Text style={[styles.cardResult, { color: item.won ? theme.success : theme.error }]}>
              {item.won ? 'WIN' : 'LOSS'}
            </Text>
          </View>
        )}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyTitle}>No matches played</Text>
            <Text style={styles.emptyText}>Your match history will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: t.text },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  summaryWin: { color: t.success, fontWeight: '800', fontSize: 14 },
  summaryDash: { color: t.textMuted },
  summaryLoss: { color: t.error, fontWeight: '800', fontSize: 14 },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: 12, padding: 12, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  cardWin: { borderLeftColor: t.success },
  cardLeft: { marginRight: 8 },
  numBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  numText: { fontSize: 12, fontWeight: '800' },
  cardIcon: { fontSize: 24, marginRight: 10 },
  cardCenter: { flex: 1 },
  cardMode: { fontSize: 14, fontWeight: '700', color: t.text },
  cardStats: { fontSize: 11, color: t.textSecondary, marginTop: 2 },
  cardPos: { fontSize: 11, color: t.textMuted, marginTop: 1 },
  cardResult: { fontWeight: '800', fontSize: 14, marginLeft: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 6 },
  emptyText: { fontSize: 13, color: t.textMuted, textAlign: 'center' },
});
