import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Switch, Alert, Image, Platform, TextInput } from 'react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import AnimatedCard from '../components/AnimatedCard';
import LinkAccountModal from '../components/LinkAccountModal';
import { useTheme } from '../utils/theme';
import api from '../api/client';

const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
  ACTIVISION: { label: 'Activision', icon: '☠️', color: '#C8102E' },
  PSN: { label: 'PlayStation', icon: '🎮', color: '#003791' },
  XBOX: { label: 'Xbox', icon: '🟢', color: '#107C10' },
  STEAM: { label: 'Steam', icon: '🖥️', color: '#1b2838' },
  BATTLE_NET: { label: 'Battle.net', icon: '⚔️', color: '#00AEFF' },
};

const RANK_DATA: Record<string, { color: string; icon: string }> = {
  BRONZE: { color: '#d97706', icon: '🥉' },
  SILVER: { color: '#9ca3af', icon: '🥈' },
  GOLD: { color: '#fbbf24', icon: '🥇' },
  PLATINUM: { color: '#14b8a6', icon: '💎' },
  DIAMOND: { color: '#06b6d4', icon: '💠' },
  MASTER: { color: '#a78bfa', icon: '🌟' },
  GRANDMASTER: { color: '#f59e0b', icon: '👑' },
};

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const statStyles = useMemo(() => createStatStyles(theme), [theme]);
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [caps, setCaps] = useState<{ xpRemaining: number; coinsRemaining: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), loadHistory(), loadBadges(), loadCaps(), loadAccounts()]);
    setRefreshing(false);
  }, []);

  async function loadAccounts() {
    try { const r = await api.get('/accounts'); setLinkedAccounts(r.data); } catch {}
  }

  async function unlinkAccount(id: string) {
    try { await api.delete(`/accounts/${id}`); await loadAccounts(); } catch {}
  }

  useEffect(() => { loadCaps(); loadAccounts(); loadHistory(); loadBadges(); }, []);

  async function handleAvatarChange() {
    if (Platform.OS === 'web') {
      const url = prompt('Enter image URL for your profile picture:');
      if (url) await uploadAvatarUrl(url);
      return;
    }
    try {
      const ImagePicker = await import('expo-image-picker');
      Alert.alert('Change Profile Picture', '', [
        {
          text: 'Take Photo',
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) { Alert.alert('Permission required', 'Camera access is needed to take a photo.'); return; }
            const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.5, allowsEditing: true, aspect: [1, 1] });
            if (!result.canceled && result.assets[0]?.base64) {
              await uploadAvatar(result.assets[0].base64);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) { Alert.alert('Permission required', 'Gallery access is needed to choose a photo.'); return; }
            const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5, allowsEditing: true, aspect: [1, 1] });
            if (!result.canceled && result.assets[0]?.base64) {
              await uploadAvatar(result.assets[0].base64);
            }
          },
        },
        { text: 'Remove Photo', style: 'destructive', onPress: async () => { await uploadAvatar(null); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch {
      Alert.alert('Not Available', 'Image picker is not available on this platform.');
    }
  }

  async function uploadAvatar(base64: string | null) {
    try {
      const avatarValue = base64 ? `data:image/jpeg;base64,${base64}` : null;
      await api.put('/profile', { avatar: avatarValue });
      await refreshUser();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile picture');
    }
  }

  async function uploadAvatarUrl(url: string | null) {
    try {
      await api.put('/profile', { avatar: url });
      await refreshUser();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile picture');
    }
  }

  async function loadCaps() {
    try { const r = await api.get('/anti-cheat/caps'); setCaps(r.data); } catch {}
  }

  async function loadHistory() {
    try { const res = await api.get('/matches/history?limit=5'); setHistory(res.data.data || []); } catch {}
  }
  async function loadBadges() {
    try { const res = await api.get('/badges'); setBadges(res.data || []); } catch {}
  }

  const rd = RANK_DATA[user?.rank || 'BRONZE'] || RANK_DATA.BRONZE;
  const winRate = user?.totalMatches ? Math.round((user.wins / user.totalMatches) * 100) : 0;
  const earnedBadges = badges.filter((b: any) => b.earned);
  const nextRank = getNextRank(user?.rank || 'BRONZE');

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={handleAvatarChange} activeOpacity={0.7}>
          <View style={[styles.avatarRing, { borderColor: rd.color }]}>
            <Text style={styles.rankIcon}>{rd.icon}</Text>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{user?.pseudo?.[0]?.toUpperCase() || '?'}</Text>
            )}
            <View style={styles.addBadge}>
              <Text style={styles.addBadgeText}>+</Text>
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.pseudo}>{user?.pseudo}</Text>
        <Text style={[styles.rankName, { color: rd.color }]}>{user?.rank}</Text>

        <View style={styles.xpSection}>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${Math.min((user?.xp || 0) % 1000 / 10, 100)}%`, backgroundColor: rd.color }]} />
          </View>
          <Text style={styles.xpText}>{user?.xp || 0} XP</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <StatBox label="Wins" value={user?.wins || 0} icon="🏆" color={theme.success} />
        <StatBox label="Losses" value={user?.losses || 0} icon="💔" color={theme.error} />
        <StatBox label="Win Rate" value={`${winRate}%`} icon="📊" color={theme.secondary} />
        <StatBox label="Phxntom Coins" value={user?.coins || 0} icon="🪙" color={theme.gold} />
        <StatBox label="Matches" value={user?.totalMatches || 0} icon="🎮" color={theme.primaryLight} />
        <StatBox label="Next Rank" value={nextRank} icon="⬆️" color={rd.color} />
      </View>

      {caps && (
        <View style={styles.capsRow}>
          <Text style={styles.capLabel}>📊 Daily Caps</Text>
          <Text style={styles.capValue}>{caps.xpRemaining} XP / {caps.coinsRemaining} Phxntom Coins remaining</Text>
        </View>
      )}

      <View style={styles.trusteRow}>
        <Text style={styles.trustLabel}>🛡️ Trust Score</Text>
        <Text style={[styles.trustValue, { color: (user?.trustScore ?? 100) > 70 ? theme.success : theme.error }]}>
          {user?.trustScore ?? 100}/100
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Linked Accounts</Text>
      {linkedAccounts.length === 0 ? (
        <Text style={styles.emptyText}>No accounts linked yet</Text>
      ) : (
        linkedAccounts.map((acc: any) => {
          const meta = PLATFORM_META[acc.platform] || { icon: '🔗', color: theme.textMuted };
          return (
            <View key={acc.id} style={[styles.linkCard, { borderLeftColor: meta.color }]}>
              <Text style={styles.linkIcon}>{meta.icon}</Text>
              <View style={styles.linkInfo}>
                <Text style={styles.linkPlatform}>{meta.label}</Text>
                <Text style={styles.linkGamertag}>{acc.gamertag}</Text>
              </View>
              <TouchableOpacity onPress={() => unlinkAccount(acc.id)}>
                <Text style={styles.unlinkText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}
      <TouchableOpacity style={styles.addLinkBtn} onPress={() => setShowLinkModal(true)}>
        <Text style={styles.addLinkText}>+ Link Another Account</Text>
      </TouchableOpacity>

      <LinkAccountModal visible={showLinkModal} onClose={() => setShowLinkModal(false)} onLinked={loadAccounts} />

      {user?.isAdmin && (
        <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/admin')}>
          <Text style={styles.adminBtnText}>⚙️ Admin Panel (Flagged Matches)</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.rewardsBtn} onPress={() => router.push('/recharge')}>
        <Text style={styles.rewardsBtnText}>🪙 Buy Phxntom Coins</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.rewardsBtn} onPress={() => router.push('/rewards')}>
        <Text style={styles.rewardsBtnText}>🎁 Rewards - Gift Cards</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.rewardsBtn} onPress={() => router.push('/legal')}>
        <Text style={styles.rewardsBtnText}>📜 Legal - CGU & Privacy</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Badges ({earnedBadges.length}/8)</Text>
      <View style={styles.badgesRow}>
        {badges.length === 0 ? (
          <Text style={styles.emptyText}>Loading badges...</Text>
        ) : badges.filter((b: any) => b.earned).length === 0 ? (
          <Text style={styles.emptyText}>No badges yet. Play matches to earn them!</Text>
        ) : (
          badges.filter((b: any) => b.earned).map((b: any) => (
            <View key={b.id} style={styles.badgeItem}>
              <Text style={styles.badgeIcon}>🏆</Text>
              <Text style={styles.badgeName}>{b.name}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionTitle}>Recent Matches</Text>
      {history.length === 0 ? (
        <Text style={styles.emptyText}>No matches played yet</Text>
      ) : (
        history.map((h: any, i: number) => (
          <View key={i} style={[styles.historyCard, h.won && { borderLeftColor: theme.success }]}>
            <Text style={styles.historyIcon}>{h.gameMode === 'KILLRACE' ? '⚔️' : h.gameMode === 'RESURGENCE' ? '🔄' : '👑'}</Text>
            <View style={styles.historyInfo}>
              <Text style={styles.historyMode}>{h.gameMode}</Text>
              <Text style={styles.historyStats}>{h.kills} kills / {h.deaths} deaths</Text>
            </View>
            <Text style={[styles.historyResult, { color: h.won ? theme.success : theme.error }]}>
              {h.won ? 'WIN' : 'LOSS'}
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity onPress={() => router.push('/history')} style={styles.viewAllBtn}>
        <Text style={styles.viewAllText}>View Full History →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.themeBtn} onPress={toggleTheme}>
        <Text style={styles.themeBtnText}>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace('/login'); }}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const { theme } = useTheme();
  const ss = useMemo(() => createStatStyles(theme), [theme]);
  return (
    <View style={[ss.box, { borderTopColor: color }]}>
      <Text style={ss.icon}>{icon}</Text>
      <Text style={[ss.value, { color }]}>{value}</Text>
      <Text style={ss.label}>{label}</Text>
    </View>
  );
}

const createStatStyles = (t: any) => StyleSheet.create({
  box: { width: '30%', backgroundColor: t.surface, borderRadius: 12, padding: 10, alignItems: 'center', borderTopWidth: 2, marginBottom: 8 },
  icon: { fontSize: 18 },
  value: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  label: { fontSize: 10, color: t.textMuted, textTransform: 'uppercase', marginTop: 2 },
});

function getNextRank(current: string): string {
  const ranks = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER'];
  const idx = ranks.indexOf(current);
  return idx < ranks.length - 1 ? ranks[idx + 1] : 'MAX';
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  profileCard: { alignItems: 'center', paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20 },
  avatarRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: t.surface, position: 'relative' },
  rankIcon: { position: 'absolute', top: -8, right: -8, fontSize: 24 },
  avatarText: { fontSize: 32, fontWeight: '900', color: t.text },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  addBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: t.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: t.background },
  addBadgeText: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 18 },
  pseudo: { fontSize: 22, fontWeight: '900', color: t.text, marginTop: 10 },
  rankName: { fontSize: 14, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 2 },
  xpSection: { width: '100%', marginTop: 16 },
  xpBar: { height: 8, backgroundColor: t.surfaceLight, borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 4 },
  xpText: { fontSize: 11, color: t.textMuted, textAlign: 'right', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', marginTop: 8 },
  capsRow: { backgroundColor: t.surfaceLight + '40', marginHorizontal: 16, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  capLabel: { fontSize: 13, color: t.textSecondary, fontWeight: '600' },
  capValue: { fontSize: 12, color: t.primaryLight, fontWeight: '700' },
  trusteRow: { backgroundColor: t.surfaceLight + '40', marginHorizontal: 16, padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  trustLabel: { fontSize: 13, color: t.textSecondary, fontWeight: '600' },
  trustValue: { fontSize: 13, fontWeight: '800' },
  adminBtn: { marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 12, backgroundColor: t.error + '20', borderWidth: 1, borderColor: t.error + '40', alignItems: 'center' },
  adminBtnText: { color: t.error, fontWeight: '700', fontSize: 13 },
  rewardsBtn: { marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 12, backgroundColor: t.surfaceLight + '40', borderWidth: 1, borderColor: t.gold + '30', alignItems: 'center' },
  rewardsBtnText: { color: t.gold, fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: t.text, paddingHorizontal: 16, marginBottom: 8, marginTop: 16 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  badgeItem: { backgroundColor: t.surface, borderRadius: 10, padding: 10, alignItems: 'center', width: '30%' },
  badgeIcon: { fontSize: 24 },
  badgeName: { fontSize: 10, color: t.text, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  emptyText: { fontSize: 13, color: t.textMuted, paddingHorizontal: 16 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 8, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  historyIcon: { fontSize: 24, marginRight: 10 },
  historyInfo: { flex: 1 },
  historyMode: { fontSize: 14, fontWeight: '700', color: t.text },
  historyStats: { fontSize: 12, color: t.textSecondary, marginTop: 2 },
  historyResult: { fontWeight: '800', fontSize: 14 },
  linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, marginHorizontal: 16, padding: 12, borderRadius: 12, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  linkIcon: { fontSize: 22, marginRight: 10 },
  linkInfo: { flex: 1 },
  linkPlatform: { fontSize: 13, fontWeight: '700', color: t.text },
  linkGamertag: { fontSize: 12, color: t.textSecondary, marginTop: 1 },
  unlinkText: { fontSize: 16, color: t.error, fontWeight: '700', padding: 4 },
  addLinkBtn: { marginHorizontal: 16, marginTop: 4, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.border, borderStyle: 'dashed', alignItems: 'center' },
  addLinkText: { color: t.primary, fontWeight: '700', fontSize: 13 },
  viewAllBtn: { paddingHorizontal: 16, marginTop: 4 },
  viewAllText: { color: t.secondary, fontWeight: '600', fontSize: 13 },
  logoutBtn: { marginHorizontal: 16, marginTop: 20, marginBottom: 40, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: t.error, alignItems: 'center' },
  logoutText: { color: t.error, fontWeight: '700', fontSize: 14 },
  themeBtn: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: t.border, alignItems: 'center' },
  themeBtnText: { color: t.text, fontWeight: '700', fontSize: 14 },
});
