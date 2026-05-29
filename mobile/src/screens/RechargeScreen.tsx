import { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

interface Package {
  id: string;
  coins: number;
  price: number;
  label: string;
}

export default function RechargeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.success === 'true' && params.coins) {
      refreshUser();
      Alert.alert('Purchase Successful', `You received ${params.coins} Phxntom Coins!`);
      router.setParams({});
    }
    api.get('/top-up/packages').then((r) => setPackages(r.data)).catch(() => {});
  }, [params.success]);

  async function handleBuy() {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await api.post('/stripe/create-checkout', { packageId: selectedId });
      if (res.data.url) {
        if (Platform.OS === 'web') {
          window.location.href = res.data.url;
        } else {
          const WebBrowser = await import('expo-web-browser');
          await WebBrowser.openAuthSessionAsync(res.data.url);
        }
      } else if (res.data.fallback) {
        Alert.alert('Request Submitted', 'Stripe is not configured. An admin will process your purchase manually.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Buy Phxntom Coins</Text>
      <Text style={styles.subtitle}>Select a package to top up your balance</Text>
      {params.success === 'true' ? (
        <Text style={styles.successBanner}>🎉 Coins credited! Check your balance.</Text>
      ) : null}
      <Text style={styles.balance}>Current balance: 🪙 {user?.coins || 0}</Text>

      <View style={styles.packages}>
        {packages.map((pkg) => {
          const selected = selectedId === pkg.id;
          return (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => setSelectedId(selected ? null : pkg.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.packIcon}>🪙</Text>
                <View>
                  <Text style={styles.packLabel}>{pkg.label}</Text>
                  <Text style={styles.packCoins}>{pkg.coins.toLocaleString()} Phxntom Coins</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.price}>€{pkg.price.toFixed(2)}</Text>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.buyBtn, !selectedId && styles.buyBtnDisabled]}
        onPress={handleBuy}
        disabled={!selectedId || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyBtnText}>BUY NOW</Text>}
      </TouchableOpacity>

      <Text style={styles.note}>
        🔒 Secure payment via Stripe. Your card details are never stored on our servers.
      </Text>
    </ScrollView>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '900', color: t.text, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: t.textSecondary, marginBottom: 16 },
  successBanner: { backgroundColor: t.success + '20', color: t.success, padding: 12, borderRadius: 10, textAlign: 'center', marginBottom: 12, overflow: 'hidden', fontWeight: '700' },
  balance: { fontSize: 16, fontWeight: '700', color: t.gold, marginBottom: 20, textAlign: 'center', backgroundColor: t.surface, padding: 14, borderRadius: 12 },
  packages: { gap: 10 },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: t.surface, borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: t.border,
  },
  cardSelected: { borderColor: t.primary, backgroundColor: t.surfaceLight },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  packIcon: { fontSize: 28 },
  packLabel: { fontSize: 15, fontWeight: '700', color: t.text },
  packCoins: { fontSize: 12, color: t.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 20, fontWeight: '900', color: t.primary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: t.textMuted, justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: t.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: t.primary },
  buyBtn: { backgroundColor: t.primary, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 24, shadowColor: t.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  buyBtnDisabled: { opacity: 0.4 },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  note: { fontSize: 11, color: t.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 16, paddingHorizontal: 10 },
});
