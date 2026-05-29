import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert, ScrollView } from 'react-native';
import { useTheme } from '../utils/theme';
import api from '../api/client';

export default function AdminScreen() {
  const { theme } = useTheme();
  const [matches, setMatches] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'flags' | 'keys'>('flags');
  const [genCount, setGenCount] = useState('1');
  const [genMaxUses, setGenMaxUses] = useState('1');
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try { const r = await api.get('/anti-cheat/flagged'); setMatches(r.data); } catch {}
    try { const r = await api.get('/early-access/list'); setKeys(r.data); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  async function handleResolve(id: string, action: 'APPROVE' | 'REJECT' | 'VOID') {
    try {
      await api.post(`/anti-cheat/flagged/${id}/resolve`, { action });
      await load();
      Alert.alert('Done', `Match ${action.toLowerCase()}d`);
    } catch {
      Alert.alert('Error', 'Failed to resolve');
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await api.post('/early-access/generate', { count: parseInt(genCount) || 1, maxUses: parseInt(genMaxUses) || 1 });
      Alert.alert('Keys Generated');
      await load();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to generate keys');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      Alert.alert('Copied', key);
    } catch {
      Alert.alert('Key', key);
    }
  }

  if (tab === 'keys') {
    return (
      <View style={[s.container, { backgroundColor: theme.background }]}>
        <View style={s.tabRow}>
          <TouchableOpacity onPress={() => setTab('flags')} style={[s.tab, { backgroundColor: theme.surface }]}>
            <Text style={[s.tabText, { color: theme.textSecondary }]}>Flagged Matches</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('keys')} style={[s.tab, { backgroundColor: theme.primary }]}>
            <Text style={[s.tabText, { color: '#fff' }]}>Early Access Keys</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={s.list}>
          <View style={[s.card, { backgroundColor: theme.surface }]}>
            <Text style={[s.sectionTitle, { color: theme.text }]}>Generate Keys</Text>
            <View style={s.genRow}>
              <View style={s.genField}>
                <Text style={[s.label, { color: theme.textSecondary }]}>Count</Text>
                <TextInput style={[s.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} value={genCount} onChangeText={setGenCount} keyboardType="number-pad" />
              </View>
              <View style={s.genField}>
                <Text style={[s.label, { color: theme.textSecondary }]}>Max Uses</Text>
                <TextInput style={[s.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]} value={genMaxUses} onChangeText={setGenMaxUses} keyboardType="number-pad" />
              </View>
            </View>
            <TouchableOpacity style={[s.btnFull, { backgroundColor: theme.primary }]} onPress={handleGenerate} disabled={generating}>
              <Text style={s.btnText}>{generating ? 'Generating...' : 'Generate Keys'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.sectionTitle, { color: theme.text, paddingHorizontal: 4, marginTop: 20 }]}>Existing Keys</Text>
          {keys.map((k: any) => (
            <TouchableOpacity key={k.id} style={[s.keyCard, { backgroundColor: theme.surface }]} onPress={() => handleCopyKey(k.key)}>
              <View style={s.keyRow}>
                <Text style={[s.keyCode, { color: theme.text }]}>{k.key}</Text>
                <Text style={[s.keyStatus, { color: k.used ? theme.error : theme.success }]}>{k.used ? `Used (${k.useCount}/${k.maxUses})` : `Active (${k.useCount}/${k.maxUses})`}</Text>
              </View>
              {k.expiresAt && <Text style={[s.keyExpiry, { color: theme.textMuted }]}>Expires: {new Date(k.expiresAt).toLocaleDateString()}</Text>}
            </TouchableOpacity>
          ))}
          {keys.length === 0 && <Text style={[s.empty, { color: theme.textMuted }]}>No keys generated yet</Text>}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <View style={s.tabRow}>
        <TouchableOpacity onPress={() => setTab('flags')} style={[s.tab, { backgroundColor: theme.primary }]}>
          <Text style={[s.tabText, { color: '#fff' }]}>Flagged Matches</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('keys')} style={[s.tab, { backgroundColor: theme.surface }]}>
          <Text style={[s.tabText, { color: theme.textSecondary }]}>Early Access Keys</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={matches}
        renderItem={({ item }) => (
          <View style={[s.card, { backgroundColor: theme.surface, borderLeftColor: theme.error }]}>
            <View style={s.cardRow}>
              <Text style={[s.mode, { color: theme.text }]}>{item.gameMode?.name}</Text>
              <Text style={[s.flag, { color: theme.error }]}>FLAGGED</Text>
            </View>
            <Text style={[s.host, { color: theme.textSecondary }]}>Host: {item.creator?.pseudo}</Text>
            <Text style={[s.reason, { color: theme.error }]}>Reason: {item.flagReason}</Text>
            <Text style={[s.players, { color: theme.textMuted }]}>
              {item.participants?.map((p: any) => p.user?.pseudo).join(', ')}
            </Text>
            <View style={s.actions}>
              <TouchableOpacity style={[s.btn, { backgroundColor: theme.success }]} onPress={() => handleResolve(item.id, 'APPROVE')}>
                <Text style={s.btnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { backgroundColor: theme.error }]} onPress={() => handleResolve(item.id, 'VOID')}>
                <Text style={s.btnText}>Void</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={<Text style={[s.empty, { color: theme.textMuted }]}>No flagged matches</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  tabText: { fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 20 },
  card: { borderRadius: 14, padding: 16, borderLeftWidth: 3 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  mode: { fontSize: 16, fontWeight: '700' },
  flag: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  host: { fontSize: 13, marginBottom: 4 },
  reason: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  players: { fontSize: 12, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnFull: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  genRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  genField: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1 },
  keyCard: { borderRadius: 12, padding: 14 },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  keyCode: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  keyStatus: { fontSize: 12, fontWeight: '600' },
  keyExpiry: { fontSize: 11, marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 60, fontSize: 14 },
});
