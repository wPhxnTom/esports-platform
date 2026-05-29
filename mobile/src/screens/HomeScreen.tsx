import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ImageBackground, Dimensions } from 'react-native';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../utils/theme';
import Logo from '../components/Logo';
import AnimatedCard from '../components/AnimatedCard';
import api from '../api/client';

const { width } = Dimensions.get('window');

const GAME_MODES = [
  { name: 'KILLRACE', icon: '⚔️', desc: 'First to reach the kill target wins. Fast-paced action.', color: '#ef4444', players: '2-8', image: require('../../assets/images/banner-killrace.png') },
  { name: 'RESURGENCE', icon: '🔄', desc: 'Respawn enabled. Score based on eliminations and placement.', color: '#06b6d4', players: '4-40', image: require('../../assets/images/banner-resurgence.png') },
  { name: 'BATTLE_ROYALE', icon: '👑', desc: 'Last one standing. High risk, high reward.', color: '#f59e0b', players: '10-100', image: require('../../assets/images/banner-battleroyale.png') },
];

const FEATURED = [
  { title: 'Ranked Play', subtitle: 'Compete in the new season', image: require('../../assets/images/banner-battleroyale.png'), color: '#f97316' },
  { title: 'Event: Double XP', subtitle: '2x XP this weekend only', image: require('../../assets/images/banner-killrace.png'), color: '#eab308' },
];

export default function HomeScreen() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    api.get('/ai/queue/count').then(r => setQueueCount(r.data.count)).catch(() => {});
    api.get('/ai/suggestions?limit=3').then(r => setSuggestions(r.data)).catch(() => {});
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    const [countRes, sugRes] = await Promise.all([
      api.get('/ai/queue/count').catch(() => ({ data: { count: 0 } })),
      api.get('/ai/suggestions?limit=3').catch(() => ({ data: [] })),
    ]);
    setQueueCount(countRes.data.count);
    setSuggestions(sugRes.data);
    setRefreshing(false);
  }, [refreshUser]);

  const winRate = user?.totalMatches ? Math.round((user.wins / user.totalMatches) * 100) : 0;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <Logo size="sm" />
        <View style={styles.headerRight}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{user?.rank || 'BRONZE'}</Text>
          </View>
          <View style={styles.coinBadge}>
            <Text style={styles.coinText}>🪙 {user?.coins || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.username}>{user?.pseudo}</Text>
        <View style={styles.xpBar}>
          <View style={[styles.xpFill, { width: `${Math.min((user?.xp || 0) % 1000 / 10, 100)}%` }]} />
        </View>
        <Text style={styles.xpText}>{user?.xp || 0} / 1000 XP</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: theme.success }]}>
          <Text style={styles.statValue}>{user?.wins || 0}</Text>
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: theme.secondary }]}>
          <Text style={styles.statValue}>{winRate}%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: theme.primaryLight }]}>
          <Text style={styles.statValue}>{user?.totalMatches || 0}</Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>FEATURED</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
        {FEATURED.map((item, i) => (
          <TouchableOpacity key={i} activeOpacity={0.8}>
            <ImageBackground source={item.image} style={styles.featuredCard} imageStyle={styles.featuredImage}>
              <View style={[styles.featuredOverlay, { backgroundColor: item.color + '99' }]}>
                <Text style={styles.featuredTitle}>{item.title}</Text>
                <Text style={styles.featuredSubtitle}>{item.subtitle}</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>GAME MODES</Text>
      {GAME_MODES.map((mode, i) => (
        <AnimatedCard key={mode.name} index={i}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/create-match', params: { gameMode: mode.name } })}
          >
            <ImageBackground source={mode.image} style={styles.modeCard} imageStyle={styles.modeCardImage}>
              <View style={[styles.modeOverlay, { backgroundColor: mode.color + '30' }]}>
                <View style={styles.modeTop}>
                  <View style={[styles.modeBadge, { backgroundColor: mode.color + '40' }]}>
                    <Text style={styles.modePlayers}>{mode.players} players</Text>
                  </View>
                </View>
                <View style={styles.modeBottom}>
                  <View style={styles.modeInfo}>
                    <Text style={styles.modeName}>{mode.icon}  {mode.name}</Text>
                    <Text style={styles.modeDesc}>{mode.desc}</Text>
                  </View>
                  <View style={[styles.playBtn, { backgroundColor: mode.color }]}>
                    <Text style={styles.playBtnText}>PLAY</Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </AnimatedCard>
      ))}

      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.primary }]} onPress={() => router.push('/quick-match')} activeOpacity={0.7}>
          <Text style={[styles.quickIcon, { color: theme.primary }]}>🤖</Text>
          <Text style={styles.quickLabel}>Quick Match</Text>
          {queueCount > 0 && <Text style={[styles.quickBadge, { backgroundColor: theme.primary }]}>{queueCount}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.secondary }]} onPress={() => router.push('/(tabs)/matches')} activeOpacity={0.7}>
          <Text style={[styles.quickIcon, { color: theme.secondary }]}>🎯</Text>
          <Text style={styles.quickLabel}>Find Match</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.accent }]} onPress={() => router.push('/(tabs)/leaderboard')} activeOpacity={0.7}>
          <Text style={[styles.quickIcon, { color: theme.accent }]}>🏆</Text>
          <Text style={styles.quickLabel}>Leaderboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, { borderColor: theme.primaryLight }]} onPress={() => router.push('/history')} activeOpacity={0.7}>
          <Text style={[styles.quickIcon, { color: theme.primaryLight }]}>📜</Text>
          <Text style={styles.quickLabel}>History</Text>
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>🤖 AI SUGGESTED MATCHUPS</Text>
          {suggestions.map((s: any, i: number) => (
            <TouchableOpacity
              key={s.userId}
              style={styles.suggestionCard}
              onPress={() => router.push('/quick-match')}
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
              <Text style={styles.suggestionAction}>Match →</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  rankBadge: { backgroundColor: t.surfaceLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: t.accent + '40' },
  rankText: { color: t.accent, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  coinBadge: { backgroundColor: t.surfaceLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: t.gold + '40' },
  coinText: { color: t.gold, fontWeight: '700', fontSize: 12 },
  hero: { paddingHorizontal: 20, paddingVertical: 12 },
  greeting: { fontSize: 14, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 2 },
  username: { fontSize: 32, fontWeight: '900', color: t.text, marginBottom: 14, letterSpacing: -0.5 },
  xpBar: { height: 4, backgroundColor: t.surfaceLight, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  xpFill: { height: '100%', backgroundColor: t.primary, borderRadius: 2 },
  xpText: { fontSize: 11, color: t.textMuted, textAlign: 'right' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: t.surface, borderRadius: 14, padding: 14, alignItems: 'center',
    borderTopWidth: 2, borderWidth: 1, borderColor: t.border,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: t.text },
  statLabel: { fontSize: 10, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: t.textMuted, paddingHorizontal: 20, marginBottom: 12, letterSpacing: 2 },
  featuredRow: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  featuredCard: { width: width * 0.72, height: 140, borderRadius: 16, overflow: 'hidden' },
  featuredImage: { borderRadius: 16 },
  featuredOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  featuredTitle: { fontSize: 18, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  featuredSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  modeCard: { marginHorizontal: 20, height: 170, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  modeCardImage: { borderRadius: 16 },
  modeOverlay: { flex: 1, justifyContent: 'space-between', padding: 16 },
  modeTop: { alignItems: 'flex-start' },
  modeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  modePlayers: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modeBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  modeInfo: { flex: 1, marginRight: 12 },
  modeName: { fontSize: 20, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  modeDesc: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 },
  playBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  playBtnText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8 },
  quickBtn: {
    width: '48%', backgroundColor: t.surface, borderRadius: 14, padding: 18, alignItems: 'center',
    borderWidth: 1, marginBottom: 8, borderColor: t.border,
  },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontSize: 13, fontWeight: '700', color: t.text },
  quickBadge: { position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: 11, color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center', lineHeight: 22, overflow: 'hidden' },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, marginHorizontal: 20, padding: 12, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: t.border, justifyContent: 'space-between' },
  suggestionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestionAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  suggestionAvatarText: { fontSize: 14, fontWeight: '800', color: t.text },
  suggestionName: { fontSize: 13, fontWeight: '700', color: t.text },
  suggestionRank: { fontSize: 10, color: t.textSecondary, marginTop: 1 },
  suggestionAction: { fontSize: 12, fontWeight: '700', color: t.primary },
});
