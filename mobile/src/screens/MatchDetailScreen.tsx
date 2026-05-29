import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView, TextInput, Alert } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../utils/theme';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import MatchResultsModal from '../components/MatchResultsModal';
import ReportPlayerModal from '../components/ReportPlayerModal';

const MODE_DATA: Record<string, { icon: string; color: string }> = {
  KILLRACE: { icon: '⚔️', color: '#ef4444' },
  RESURGENCE: { icon: '🔄', color: '#06b6d4' },
  BATTLE_ROYALE: { icon: '👑', color: '#f59e0b' },
};

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { on, emit } = useSocket(id as string);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState({ kills: '0', deaths: '0', score: '0', position: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultsVisible, setResultsVisible] = useState(false);
  const [matchResults, setMatchResults] = useState<any>(null);
  const [playersSubmitted, setPlayersSubmitted] = useState<Set<string>>(new Set());
  const [caps, setCaps] = useState<{ xpRemaining: number; coinsRemaining: number } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; pseudo: string } | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [showProofInput, setShowProofInput] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/matches/${id}`);
      setMatch(res.data);
      const submitted = new Set<string>();
      res.data.players?.forEach((p: any) => {
        if (p.kills > 0 || p.deaths > 0 || p.score > 0) submitted.add(p.userId);
      });
      setPlayersSubmitted(submitted);
      if (res.data.status === 'COMPLETED') {
        try {
          const resultsRes = await api.get(`/matches/${id}/results`);
          setMatchResults(resultsRes.data);
          setResultsVisible(true);
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); loadCaps(); }, [load]);

  async function loadCaps() {
    try { const r = await api.get('/anti-cheat/caps'); setCaps(r.data); } catch {}
  }

  async function handleConfirm() {
    try {
      await api.post(`/anti-cheat/matches/${id}/confirm`);
      Alert.alert('Confirmed', 'Match result confirmed');
      await load();
    } catch { Alert.alert('Error', 'Failed to confirm'); }
  }

  async function handleSubmitProof() {
    if (!proofUrl) { Alert.alert('Error', 'Please enter a proof URL or description'); return; }
    try {
      await api.post('/anti-cheat/proof', { matchId: id, proofUrl, notes: 'Screenshot proof' });
      Alert.alert('Submitted', 'Proof submitted for review');
      setShowProofInput(false);
      setProofUrl('');
    } catch { Alert.alert('Error', 'Failed to submit proof'); }
  }

  useEffect(() => {
    const unsub1 = on('match:started', () => load());
    const unsub2 = on('score:submitted', ({ userId }: { userId: string }) => {
      setPlayersSubmitted(prev => new Set(prev).add(userId));
    });
    const unsub3 = on('match:completed', async () => {
      await load();
      try {
        const resultsRes = await api.get(`/matches/${id}/results`);
        setMatchResults(resultsRes.data);
        setResultsVisible(true);
      } catch {}
    });
    return () => { unsub1?.(); unsub2?.(); unsub3?.(); };
  }, [on, load, id]);

  const md = match ? MODE_DATA[match.gameMode] || { icon: '🎮', color: theme.primary } : { icon: '🎮', color: theme.primary };
  const isPlayer = match?.players?.some((p: any) => p.userId === user?.id);
  const isCreator = match?.creator?.id === user?.id;
  const myParticipation = match?.players?.find((p: any) => p.userId === user?.id);

  async function handleJoin() {
    try { const res = await api.post(`/matches/${id}/join`); setMatch(res.data); setError(''); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed to join'); }
  }

  async function handleStart() {
    try {
      const res = await api.post(`/matches/${id}/start`);
      setMatch(res.data);
      emit('match:started', id);
    }
    catch (err: any) { setError(err.response?.data?.message || 'Failed to start'); }
  }

  async function handleSubmitScore() {
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/matches/${id}/score`, {
        kills: parseInt(score.kills) || 0,
        deaths: parseInt(score.deaths) || 0,
        score: parseInt(score.score) || 0,
        position: score.position ? parseInt(score.position) : undefined,
      });
      emit('score:submitted', id, user?.id);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  }

  if (loading) return <View style={styles.container}><Text style={styles.centerText}>Loading...</Text></View>;
  if (!match) return <View style={styles.container}><Text style={styles.centerText}>Match not found</Text></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={theme.primary} />}>
      <View style={[styles.banner, { backgroundColor: md.color + '15' }]}>
        <Text style={styles.bannerIcon}>{md.icon}</Text>
        <Text style={[styles.bannerMode, { color: md.color }]}>{match.gameMode}</Text>
        <View style={[styles.statusPill, {
          backgroundColor: match.status === 'WAITING' ? theme.accent + '25' : match.status === 'IN_PROGRESS' ? theme.success + '25' : theme.textMuted + '25'
        }]}>
          <Text style={[styles.statusText, {
            color: match.status === 'WAITING' ? theme.accent : match.status === 'IN_PROGRESS' ? theme.success : theme.textMuted
          }]}>{match.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <InfoChip icon="👑" label="Host" value={match.creator?.pseudo} />
        <InfoChip icon="👥" label="Players" value={`${match.players.length}/${match.maxPlayers}`} />
        <InfoChip icon="🪙" label="Entry Fee" value={`${match.entryFee || 0}`} />
      </View>

      <Text style={styles.sectionTitle}>Players</Text>
      {match.players.map((p: any, i: number) => (
        <View key={i} style={[styles.playerCard, p.userId === user?.id && { borderColor: theme.primary }]}>
          <View style={[styles.playerAvatar, { backgroundColor: md.color + '30' }]}>
            <Text style={styles.playerAvatarText}>{p.pseudo[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{p.pseudo} {p.userId === match.creator?.id ? '👑' : ''}</Text>
            <Text style={styles.playerStats}>K: {p.kills} | Score: {p.score}</Text>
          </View>
          {p.userId === user?.id && <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>}
        </View>
      ))}

      {match.status === 'WAITING' && !isPlayer && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: md.color }]} onPress={handleJoin}>
          <Text style={styles.actionBtnText}>Join Match</Text>
        </TouchableOpacity>
      )}

      {match.status === 'WAITING' && isCreator && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.success }]} onPress={handleStart}>
          <Text style={styles.actionBtnText}>Start Match</Text>
        </TouchableOpacity>
      )}

      {match.status === 'IN_PROGRESS' && isPlayer && !myParticipation?.score && (
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>Submit Your Score</Text>
          <View style={styles.scoreRow}>
            <ScoreField label="Kills" value={score.kills} onChange={(v) => setScore({ ...score, kills: v })} />
            <ScoreField label="Deaths" value={score.deaths} onChange={(v) => setScore({ ...score, deaths: v })} />
            <ScoreField label="Score" value={score.score} onChange={(v) => setScore({ ...score, score: v })} />
          </View>
          {match.gameMode === 'BATTLE_ROYALE' && (
            <TextInput
              style={styles.positionInput}
              placeholder="Placement (1 = winner)"
              placeholderTextColor={theme.textMuted}
              value={score.position}
              onChangeText={(v) => setScore({ ...score, position: v })}
              keyboardType="number-pad"
            />
          )}
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: md.color }]} onPress={handleSubmitScore} disabled={submitting}>
            <Text style={styles.actionBtnText}>{submitting ? 'Submitting...' : 'Submit Score'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {match.status === 'IN_PROGRESS' && isPlayer && myParticipation?.score > 0 && (
        <View style={styles.submittedBanner}>
          <Text style={styles.submittedText}>✓ Score submitted — waiting for others</Text>
        </View>
      )}

      {match.status === 'COMPLETED' && match.winner && (
        <View style={styles.winnerSection}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.winnerLabel}>Winner</Text>
          <Text style={styles.winnerName}>{match.winner.pseudo}</Text>
          <TouchableOpacity style={styles.resultsBtn} onPress={async () => {
            try { const r = await api.get(`/matches/${id}/results`); setMatchResults(r.data); setResultsVisible(true); } catch {}
          }}>
            <Text style={styles.resultsBtnText}>View Full Results</Text>
          </TouchableOpacity>

          {caps && (
            <View style={styles.capsRow}>
              <Text style={styles.capText}>📊 Daily: {caps.xpRemaining} XP / {caps.coinsRemaining} Phxntom Coins remaining</Text>
            </View>
          )}

          {!match.players?.find((p: any) => p.userId === user?.id)?.confirmed && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.success }]} onPress={handleConfirm}>
              <Text style={styles.actionBtnText}>✓ Confirm Result</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.reportBtn} onPress={() => {
            const other = match.players?.find((p: any) => p.userId !== user?.id);
            if (other) setReportTarget({ id: other.userId, pseudo: other.pseudo });
          }}>
            <Text style={styles.reportBtnText}>🚩 Report Player</Text>
          </TouchableOpacity>

          {!showProofInput ? (
            <TouchableOpacity style={styles.proofBtn} onPress={() => setShowProofInput(true)}>
              <Text style={styles.proofBtnText}>📸 Submit Proof (Screenshot)</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.proofInputRow}>
              <TextInput
                style={styles.proofInput}
                placeholder="Paste proof URL or description..."
                placeholderTextColor={theme.textMuted}
                value={proofUrl}
                onChangeText={setProofUrl}
              />
              <TouchableOpacity style={styles.proofSubmitBtn} onPress={handleSubmitProof}>
                <Text style={styles.proofSubmitText}>Send</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <ReportPlayerModal
        visible={!!reportTarget}
        onClose={() => setReportTarget(null)}
        matchId={id as string}
        targetId={reportTarget?.id || ''}
        targetPseudo={reportTarget?.pseudo || ''}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ height: 40 }} />

      <MatchResultsModal
        visible={resultsVisible}
        onClose={() => setResultsVisible(false)}
        results={matchResults}
        myUserId={user?.id}
      />
    </ScrollView>
  );
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { theme } = useTheme();
  const chipStyles = useMemo(() => createChipStyles(theme), [theme]);
  return (
    <View style={chipStyles.wrap}>
      <Text style={chipStyles.icon}>{icon}</Text>
      <View>
        <Text style={chipStyles.label}>{label}</Text>
        <Text style={chipStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const createChipStyles = (t: any) => StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: 12, padding: 12, gap: 10, flex: 1 },
  icon: { fontSize: 20 },
  label: { fontSize: 11, color: t.textMuted, textTransform: 'uppercase' },
  value: { fontSize: 14, fontWeight: '700', color: t.text },
});

function ScoreField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { theme } = useTheme();
  const sfStyles = useMemo(() => createSfStyles(theme), [theme]);
  return (
    <View style={sfStyles.wrap}>
      <Text style={sfStyles.label}>{label}</Text>
      <TextInput style={sfStyles.input} value={value} onChangeText={onChange} keyboardType="number-pad" />
    </View>
  );
}

const createSfStyles = (t: any) => StyleSheet.create({
  wrap: { flex: 1 },
  label: { fontSize: 11, color: t.textSecondary, marginBottom: 4, textAlign: 'center', fontWeight: '600' },
  input: { backgroundColor: t.surface, borderRadius: 10, padding: 12, color: t.text, textAlign: 'center', fontSize: 18, fontWeight: '700', borderWidth: 1, borderColor: t.border },
});

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  centerText: { color: t.textSecondary, textAlign: 'center', marginTop: 60, fontSize: 15 },
  banner: { alignItems: 'center', paddingVertical: 28, marginHorizontal: 16, borderRadius: 16, marginTop: 12 },
  bannerIcon: { fontSize: 48 },
  bannerMode: { fontSize: 22, fontWeight: '900', marginTop: 8 },
  statusPill: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  infoRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: t.text, paddingHorizontal: 16, marginBottom: 10, marginTop: 16 },
  playerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  playerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  playerInfo: { flex: 1, marginLeft: 10 },
  playerName: { fontSize: 14, fontWeight: '700', color: t.text },
  playerStats: { fontSize: 12, color: t.textSecondary, marginTop: 2 },
  youBadge: { backgroundColor: t.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  youBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  actionBtn: { marginHorizontal: 16, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  scoreSection: { marginTop: 8, marginBottom: 16 },
  scoreRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  positionInput: { backgroundColor: t.surface, borderRadius: 12, padding: 14, color: t.text, fontSize: 15, marginHorizontal: 16, marginTop: 10, borderWidth: 1, borderColor: t.border },
  submittedBanner: { backgroundColor: t.success + '15', marginHorizontal: 16, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  submittedText: { color: t.success, fontWeight: '600', fontSize: 13 },
  resultsBtn: { marginTop: 12, backgroundColor: t.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  resultsBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  winnerSection: { alignItems: 'center', padding: 24, marginTop: 16 },
  trophy: { fontSize: 56 },
  winnerLabel: { fontSize: 12, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginTop: 6 },
  winnerName: { fontSize: 22, fontWeight: '900', color: t.gold, marginTop: 4 },
  capsRow: { marginTop: 8, backgroundColor: t.surfaceLight + '50', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  capText: { fontSize: 11, color: t.textMuted, textAlign: 'center' },
  reportBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: t.error + '50' },
  reportBtnText: { color: t.error, fontWeight: '600', fontSize: 13 },
  proofBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: t.primary + '50' },
  proofBtnText: { color: t.primaryLight, fontWeight: '600', fontSize: 13 },
  proofInputRow: { flexDirection: 'row', marginTop: 8, paddingHorizontal: 16, gap: 8 },
  proofInput: { flex: 1, backgroundColor: t.surface, borderRadius: 10, padding: 10, color: t.text, fontSize: 13, borderWidth: 1, borderColor: t.border },
  proofSubmitBtn: { backgroundColor: t.primary, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  proofSubmitText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  error: { color: t.error, fontSize: 13, textAlign: 'center', marginHorizontal: 16, marginTop: 12, backgroundColor: t.error + '15', padding: 10, borderRadius: 8 },
});
