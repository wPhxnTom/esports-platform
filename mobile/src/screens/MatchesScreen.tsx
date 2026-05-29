import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../utils/theme';
import api from '../api/client';

const MODE_DATA: Record<string, { icon: string; color: string }> = {
  KILLRACE: { icon: '⚔️', color: '#ef4444' },
  RESURGENCE: { icon: '🔄', color: '#06b6d4' },
  BATTLE_ROYALE: { icon: '👑', color: '#f59e0b' },
};

const FILTERS = ['ALL', 'KILLRACE', 'RESURGENCE', 'BATTLE_ROYALE'];

export default function MatchesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [matches, setMatches] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const router = useRouter();

  const load = useCallback(async () => {
    try { const res = await api.get('/matches'); setMatches(res.data); } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  const filtered = matches.filter((m) => {
    if (filter !== 'ALL' && m.gameMode !== filter) return false;
    if (search && !m.creator?.pseudo?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Open Matches</Text>
          <Text style={styles.subtitle}>{filtered.length} match{filtered.length !== 1 ? 'es' : ''} available</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-match')}>
          <Text style={styles.createIcon}>+</Text>
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by host..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'ALL' ? 'All' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={({ item }) => {
          const md = MODE_DATA[item.gameMode] || { icon: '🎮', color: theme.primary };
          return (
            <TouchableOpacity
              style={[styles.card, { borderLeftColor: md.color }]}
              onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeIcon}>{md.icon}</Text>
                  <View>
                    <Text style={styles.modeName}>{item.gameMode}</Text>
                    <Text style={styles.hostText}>by {item.creator?.pseudo}</Text>
                  </View>
                </View>
                <View style={[styles.playerCount, { backgroundColor: md.color + '25' }]}>
                  <Text style={[styles.playerCountText, { color: md.color }]}>
                    {item.players.length}/{item.maxPlayers}
                  </Text>
                  <Text style={[styles.playerLabel, { color: md.color }]}>players</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Waiting for players</Text>
                <View style={styles.costBadge}>
                  <Text style={styles.costText}>🪙 {item.entryFee || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎮</Text>
            <Text style={styles.emptyTitle}>
              {search || filter !== 'ALL' ? 'No matches match your filters' : 'No matches yet'}
            </Text>
            <Text style={styles.emptyText}>
              {search || filter !== 'ALL' ? 'Try changing your search or filter' : 'Create a match or wait for others to join'}
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/create-match')}>
              <Text style={styles.emptyBtnText}>Create a Match</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 4 },
  createIcon: { fontSize: 18, color: '#fff', fontWeight: '800' },
  createText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: { backgroundColor: t.surface, borderRadius: 10, padding: 12, color: t.text, fontSize: 14, borderWidth: 1, borderColor: t.border },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: t.surface },
  filterChipActive: { backgroundColor: t.primary },
  filterText: { fontSize: 12, color: t.textSecondary, fontWeight: '600' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 20 },
  card: { backgroundColor: t.surface, borderRadius: 14, padding: 16, borderLeftWidth: 3, borderWidth: 1, borderColor: t.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modeInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeIcon: { fontSize: 28 },
  modeName: { fontSize: 15, fontWeight: '700', color: t.text },
  hostText: { fontSize: 12, color: t.textMuted, marginTop: 2 },
  playerCount: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: t.border },
  playerCountText: { fontSize: 18, fontWeight: '900' },
  playerLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent },
  statusText: { fontSize: 12, color: t.textMuted, flex: 1 },
  costBadge: { backgroundColor: t.gold + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  costText: { fontSize: 11, color: t.gold, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 6 },
  emptyText: { fontSize: 13, color: t.textMuted, textAlign: 'center', marginBottom: 20, paddingHorizontal: 40 },
  emptyBtn: { backgroundColor: t.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
