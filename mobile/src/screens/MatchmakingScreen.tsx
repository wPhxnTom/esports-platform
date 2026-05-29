import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../utils/theme';
import api from '../api/client';

const GAME_MODES = ['KILLRACE', 'RESURGENCE', 'BATTLE_ROYALE'];
const MODE_META: Record<string, { icon: string; color: string }> = {
  KILLRACE: { icon: '⚔️', color: '#ef4444' },
  RESURGENCE: { icon: '🔄', color: '#06b6d4' },
  BATTLE_ROYALE: { icon: '👑', color: '#f59e0b' },
};

export default function MatchmakingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [inQueue, setInQueue] = useState(false);
  const [queueGameMode, setQueueGameMode] = useState('KILLRACE');
  const [queueCount, setQueueCount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchFound, setMatchFound] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [statusRes, countRes, sugRes] = await Promise.all([
        api.get('/ai/queue/status'),
        api.get('/ai/queue/count'),
        api.get('/ai/suggestions?limit=4'),
      ]);
      if (statusRes.data.inQueue) {
        setInQueue(true);
        setQueueGameMode(statusRes.data.gameMode);
        startPolling();
      } else {
        setInQueue(false);
        setMatchFound(null);
      }
      setQueueCount(countRes.data.count);
      setSuggestions(sugRes.data);
    } catch {}
  }, []);

  useEffect(() => { loadData(); return () => stopPolling(); }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get('/ai/queue/status');
        if (!r.data.inQueue) {
          setInQueue(false);
          stopPolling();
          const matchR = await api.get('/matches/history?limit=1');
          if (matchR.data.data?.[0]) {
            setMatchFound(matchR.data.data[0]);
          }
        }
        const c = await api.get('/ai/queue/count');
        setQueueCount(c.data.count);
      } catch {}
    }, 3000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const joinQueue = async () => {
    setLoading(true);
    try {
      const r = await api.post('/ai/queue/join', { gameMode: queueGameMode });
      if (r.data.queued) {
        setInQueue(true);
        setMatchFound(null);
        startPolling();
      }
      if (r.data.matched) {
        setMatchFound(r.data.matched);
        setInQueue(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join queue');
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    try {
      await api.post('/ai/queue/leave');
      setInQueue(false);
      stopPolling();
    } catch {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 AI Matchmaking</Text>
        <Text style={styles.subtitle}>Let AI find and balance your matches</Text>
      </View>

      <View style={styles.queueCard}>
        <Text style={styles.playersOnline}>{queueCount} player{queueCount !== 1 ? 's' : ''} in queue</Text>

        {inQueue ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.searchingText}>Searching for opponents...</Text>
            <Text style={styles.searchingMode}>Mode: {MODE_META[queueGameMode]?.icon} {queueGameMode}</Text>
            <TouchableOpacity style={styles.leaveBtn} onPress={leaveQueue}>
              <Text style={styles.leaveBtnText}>Leave Queue</Text>
            </TouchableOpacity>
          </View>
        ) : matchFound ? (
          <View style={styles.foundContainer}>
            <Text style={styles.foundIcon}>✅</Text>
            <Text style={styles.foundText}>Match Found!</Text>
            <TouchableOpacity style={styles.joinMatchBtn} onPress={() => router.push(`/match/${matchFound.matchId}`)}>
              <Text style={styles.joinMatchBtnText}>Join Match</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMatchFound(null)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.joinContainer}>
            <Text style={styles.selectModeText}>Select Game Mode</Text>
            <View style={styles.modeRow}>
              {GAME_MODES.map(mode => {
                const meta = MODE_META[mode];
                const selected = queueGameMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.modeChip, selected && { backgroundColor: meta.color + '30', borderColor: meta.color }]}
                    onPress={() => setQueueGameMode(mode)}
                  >
                    <Text style={styles.modeIcon}>{meta.icon}</Text>
                    <Text style={[styles.modeLabel, selected && { color: meta.color }]}>{mode}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={[styles.findBtn, { opacity: loading ? 0.6 : 1 }]} onPress={joinQueue} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.findBtnText}>🎯 Quick Match</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>AI Suggested Opponents</Text>
      {suggestions.length === 0 ? (
        <Text style={styles.emptyText}>No suggestions right now. Play more matches to get better matchups.</Text>
      ) : (
        suggestions.map((s: any, i: number) => (
          <TouchableOpacity
            key={s.userId}
            style={styles.suggestionCard}
            onPress={() => {
              setQueueGameMode('KILLRACE');
              joinQueue();
            }}
          >
            <View style={styles.suggestionLeft}>
              <View style={[styles.suggestionAvatar, { backgroundColor: theme.surfaceLight }]}>
                <Text style={styles.suggestionAvatarText}>{s.pseudo?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View>
                <Text style={styles.suggestionName}>{s.pseudo}</Text>
                <Text style={styles.suggestionRank}>{s.rank} · {s.wins}W/{s.losses}L</Text>
              </View>
            </View>
            <View style={styles.suggestionRight}>
              <Text style={styles.suggestionTrust}>🛡️ {s.trustScore}</Text>
              <Text style={styles.suggestionAction}>Match →</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/matches')}>
        <Text style={styles.browseBtnText}>Browse Open Matches →</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  header: { padding: 20, paddingTop: 56 },
  title: { fontSize: 26, fontWeight: '900', color: t.text, marginBottom: 4 },
  subtitle: { fontSize: 13, color: t.textSecondary, lineHeight: 18 },
  queueCard: {
    backgroundColor: t.surface, marginHorizontal: 20, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: t.border, marginBottom: 20, alignItems: 'center',
  },
  playersOnline: { fontSize: 12, fontWeight: '700', color: t.primaryLight, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  searchingContainer: { alignItems: 'center', gap: 10, paddingVertical: 10 },
  searchingText: { fontSize: 16, fontWeight: '800', color: t.text },
  searchingMode: { fontSize: 13, color: t.textSecondary },
  leaveBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: t.error },
  leaveBtnText: { color: t.error, fontWeight: '700', fontSize: 13 },
  foundContainer: { alignItems: 'center', gap: 10, paddingVertical: 10 },
  foundIcon: { fontSize: 40 },
  foundText: { fontSize: 20, fontWeight: '900', color: t.success },
  joinMatchBtn: { backgroundColor: t.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  joinMatchBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  dismissText: { color: t.textMuted, fontWeight: '600', fontSize: 12, marginTop: 6 },
  joinContainer: { width: '100%', gap: 12 },
  selectModeText: { fontSize: 12, fontWeight: '700', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: t.border, backgroundColor: t.background, gap: 6 },
  modeIcon: { fontSize: 16 },
  modeLabel: { fontSize: 11, fontWeight: '600', color: t.textSecondary },
  findBtn: { backgroundColor: t.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  findBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: t.text, paddingHorizontal: 20, marginBottom: 12 },
  emptyText: { fontSize: 13, color: t.textMuted, paddingHorizontal: 20, lineHeight: 18, marginBottom: 16 },
  suggestionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, marginHorizontal: 20,
    padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: t.border, justifyContent: 'space-between',
  },
  suggestionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestionAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  suggestionAvatarText: { fontSize: 16, fontWeight: '800', color: t.text },
  suggestionName: { fontSize: 14, fontWeight: '700', color: t.text },
  suggestionRank: { fontSize: 11, color: t.textSecondary, marginTop: 1 },
  suggestionRight: { alignItems: 'flex-end', gap: 2 },
  suggestionTrust: { fontSize: 11, color: t.textMuted },
  suggestionAction: { fontSize: 12, fontWeight: '700', color: t.primary },
  browseBtn: { marginHorizontal: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: t.border, alignItems: 'center', marginTop: 8 },
  browseBtnText: { color: t.textSecondary, fontWeight: '700', fontSize: 13 },
});
