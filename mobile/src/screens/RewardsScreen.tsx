import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function RewardsScreen() {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [cards, setCards] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/rewards/gift-cards');
      setCards(r.data.cards);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshUser()]);
    setRefreshing(false);
  }, [load, refreshUser]);

  async function handleRedeem(card: any) {
    if ((user?.coins ?? 0) < card.cost) {
      Alert.alert('Not enough Phxntom Coins', `You need ${card.cost} Phxntom Coins but you have ${user?.coins ?? 0}.`);
      return;
    }
    Alert.alert(
      `Redeem ${card.name}`,
      `Exchange ${card.cost} Phxntom Coins for ${card.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'default',
          onPress: async () => {
            setRedeeming(card.id);
            try {
              const r = await api.post(`/rewards/redeem/${card.id}`);
              Alert.alert('Success!', r.data.message);
              await onRefresh();
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Redemption failed');
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  }

  const providerIcons: Record<string, string> = {
    Amazon: '📦', PlayStation: '🎮', Steam: '💻', Netflix: '🎬', Spotify: '🎵', 'Uber Eats': '🍔',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>{user?.coins ?? 0} 🪙</Text>
        </View>
      </View>
      <View style={styles.subRow}>
        <Text style={styles.subtitle}>Exchange your Phxntom Coins for gift cards</Text>
        <TouchableOpacity onPress={() => router.push('/recharge')}>
          <Text style={styles.buyLink}>+ Buy Coins</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => handleRedeem(item)}
            disabled={redeeming === item.id}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.primary + '20' }]}>
                <Text style={styles.icon}>{providerIcons[item.provider] || '🎁'}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardStock}>Stock: {item.stock}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cost}>{item.cost}</Text>
              <Text style={styles.costLabel}>🪙</Text>
              {redeeming === item.id ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <TouchableOpacity
                  style={[styles.redeemBtn, (user?.coins ?? 0) < item.cost && { opacity: 0.4 }]}
                  onPress={() => handleRedeem(item)}
                >
                  <Text style={styles.redeemBtnText}>Redeem</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyTitle}>No rewards available</Text>
            <Text style={styles.emptyText}>Check back later for new gift cards</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  coinBadge: { backgroundColor: t.surfaceLight, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: t.gold + '40' },
  coinText: { color: t.gold, fontWeight: '700', fontSize: 12 },
  subtitle: { fontSize: 13, color: t.textMuted, paddingHorizontal: 20 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20, marginBottom: 16 },
  buyLink: { color: t.primary, fontWeight: '800', fontSize: 13, padding: 4 },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 20 },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: t.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: t.border,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: t.text },
  cardDesc: { fontSize: 11, color: t.textMuted, marginTop: 2 },
  cardStock: { fontSize: 10, color: t.textMuted, marginTop: 4 },
  cardRight: { alignItems: 'center', gap: 2, marginLeft: 8 },
  cost: { fontSize: 20, fontWeight: '900', color: t.gold },
  costLabel: { fontSize: 9, color: t.textMuted, textTransform: 'uppercase' },
  redeemBtn: { marginTop: 6, backgroundColor: t.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  redeemBtnText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 4 },
  emptyText: { fontSize: 13, color: t.textMuted, textAlign: 'center' },
});
