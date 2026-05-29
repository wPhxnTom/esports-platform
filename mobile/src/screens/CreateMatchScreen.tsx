import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../utils/theme';
import api from '../api/client';

const ENTRY_FEES: Record<string, number> = {
  KILLRACE: 5,
  RESURGENCE: 10,
  BATTLE_ROYALE: 25,
};

const MODES = [
  { name: 'KILLRACE', icon: '⚔️', desc: 'First to the kill target wins', color: '#ef4444', max: 8, min: 2 },
  { name: 'RESURGENCE', icon: '🔄', desc: 'Respawn enabled, score based on kills + placement', color: '#06b6d4', max: 40, min: 4 },
  { name: 'BATTLE_ROYALE', icon: '👑', desc: 'Last one standing wins it all', color: '#f59e0b', max: 100, min: 10 },
];

export default function CreateMatchScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState((params.gameMode as string) || 'KILLRACE');
  const [maxPlayers, setMaxPlayers] = useState('8');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const current = MODES.find((m) => m.name === selected) || MODES[0];
  const players = Math.min(parseInt(maxPlayers) || current.min, current.max);

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/matches', { gameMode: selected, maxPlayers: players });
      router.replace({ pathname: '/match/[id]', params: { id: res.data.id } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create a Match</Text>
      <Text style={styles.subtitle}>Choose your game mode and settings</Text>

      <Text style={styles.label}>Game Mode</Text>
      {MODES.map((mode) => (
        <TouchableOpacity
          key={mode.name}
          style={[styles.modeCard, selected === mode.name && { borderColor: mode.color, backgroundColor: mode.color + '12' }]}
          onPress={() => { setSelected(mode.name); setMaxPlayers(String(Math.min(8, mode.max))); }}
          activeOpacity={0.8}
        >
          <View style={styles.modeLeft}>
            <Text style={styles.modeIcon}>{mode.icon}</Text>
            <View>
              <Text style={styles.modeName}>{mode.name}</Text>
              <Text style={styles.modeDesc}>{mode.desc}</Text>
              <Text style={styles.modePlayers}>{mode.min}-{mode.max} players · 🪙 {ENTRY_FEES[mode.name]} entry</Text>
            </View>
          </View>
          {selected === mode.name && <Text style={[styles.check, { color: mode.color }]}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Max Players ({current.min}-{current.max})</Text>
      <View style={styles.playerRow}>
        {[current.min, Math.round((current.max + current.min) / 2), current.max].filter((v, i, a) => a.indexOf(v) === i).map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.playerOption, players === n && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setMaxPlayers(String(n))}
          >
            <Text style={[styles.playerOptionText, players === n && { color: '#fff' }]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.createBtn, { backgroundColor: current.color }]} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create {selected} Match</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background, padding: 20, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: '900', color: t.text },
  subtitle: { fontSize: 13, color: t.textSecondary, marginTop: 4, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 8 },
  modeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: 'transparent' },
  modeLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  modeIcon: { fontSize: 32 },
  modeName: { fontSize: 15, fontWeight: '700', color: t.text },
  modeDesc: { fontSize: 12, color: t.textSecondary, marginTop: 2 },
  modePlayers: { fontSize: 11, color: t.textMuted, marginTop: 2 },
  check: { fontSize: 20, fontWeight: '800' },
  playerRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  playerOption: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface },
  playerOptionText: { fontSize: 15, fontWeight: '700', color: t.text },
  createBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  error: { color: t.error, fontSize: 13, textAlign: 'center', backgroundColor: t.error + '15', padding: 10, borderRadius: 8, marginBottom: 8 },
});
