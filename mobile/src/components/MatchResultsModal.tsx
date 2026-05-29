import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';

interface ResultPlayer {
  userId: string;
  pseudo: string;
  score: number;
  kills: number;
  deaths: number;
  position: number | null;
  kd: string;
}

interface MatchResultsProps {
  visible: boolean;
  onClose: () => void;
  results: {
    gameMode: string;
    winner: { id: string; pseudo: string } | null;
    participants: ResultPlayer[];
    rewards?: { xpEarned: number; coinsEarned: number; isWinner: boolean }[];
    earnedBadges?: { badgeName: string }[];
  } | null;
  myUserId?: string;
}

export default function MatchResultsModal({ visible, onClose, results, myUserId }: MatchResultsProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  if (!results) return null;

  const myReward = results.rewards?.find(r => r);
  const isWinner = results.winner?.id === myUserId;
  const newBadges = results.earnedBadges?.filter(b => b) || [];
  const sorted = [...results.participants].sort((a, b) => (a.position || 99) - (b.position || 99));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.title}>{isWinner ? 'VICTORY!' : 'MATCH COMPLETE'}</Text>
          {isWinner && <Text style={styles.trophy}>🏆</Text>}
          <Text style={styles.mode}>{results.gameMode}</Text>

          {myReward && (
            <View style={styles.rewardsRow}>
              <View style={styles.rewardBox}>
                <Text style={styles.rewardValue}>+{myReward.xpEarned}</Text>
                <Text style={styles.rewardLabel}>XP</Text>
              </View>
              <View style={styles.rewardBox}>
                <Text style={styles.rewardValue}>+{myReward.coinsEarned}</Text>
                <Text style={styles.rewardLabel}>Phxntom Coins</Text>
              </View>
            </View>
          )}

          {newBadges.length > 0 && (
            <View style={styles.badgesSection}>
              <Text style={styles.badgesTitle}>Badges Unlocked!</Text>
              {newBadges.map((b, i) => (
                <Text key={i} style={styles.badgeName}>🎖️ {b.badgeName}</Text>
              ))}
            </View>
          )}

          <Text style={styles.standingsTitle}>Standings</Text>
          <ScrollView style={styles.standingsList}>
            {sorted.map((p, i) => (
              <View key={i} style={[styles.standingRow, p.userId === myUserId && styles.myRow]}>
                <View style={[styles.placeBadge, { backgroundColor: i === 0 ? theme.gold + '30' : theme.surfaceLight }]}>
                  <Text style={[styles.placeText, { color: i === 0 ? theme.gold : theme.textSecondary }]}>
                    {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `#${i + 1}`}
                  </Text>
                </View>
                <Text style={styles.pseudo}>{p.pseudo} {p.userId === myUserId ? '(You)' : ''}</Text>
                <Text style={styles.stats}>{p.kills}K / {p.deaths}D</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.homeBtn} onPress={() => { onClose(); router.replace('/(tabs)'); }}>
              <Text style={styles.homeBtnText}>Go to Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Stay Here</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: t.background, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: t.border, maxHeight: '90%' },
  title: { fontSize: 26, fontWeight: '900', color: t.text, textAlign: 'center', letterSpacing: 2 },
  trophy: { fontSize: 48, textAlign: 'center', marginVertical: 8 },
  mode: { fontSize: 14, color: t.textSecondary, textAlign: 'center', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  rewardsRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 },
  rewardBox: { backgroundColor: t.surface, borderRadius: 12, padding: 12, alignItems: 'center', minWidth: 80 },
  rewardValue: { fontSize: 22, fontWeight: '900', color: t.primaryLight },
  rewardLabel: { fontSize: 11, color: t.textMuted, textTransform: 'uppercase', marginTop: 2 },
  badgesSection: { backgroundColor: t.surface, borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center' },
  badgesTitle: { fontSize: 13, fontWeight: '700', color: t.accent, marginBottom: 6 },
  badgeName: { fontSize: 13, color: t.text, marginVertical: 2 },
  standingsTitle: { fontSize: 14, fontWeight: '700', color: t.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  standingsList: { maxHeight: 200, marginBottom: 16 },
  standingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: 10, padding: 10, marginBottom: 6 },
  myRow: { borderWidth: 1, borderColor: t.primary },
  placeBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  placeText: { fontSize: 12, fontWeight: '800' },
  pseudo: { flex: 1, fontSize: 14, fontWeight: '600', color: t.text },
  stats: { fontSize: 12, color: t.textSecondary },
  actions: { flexDirection: 'row', gap: 10 },
  homeBtn: { flex: 1, backgroundColor: t.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  homeBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  closeBtn: { flex: 1, backgroundColor: t.surface, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: t.border },
  closeBtnText: { color: t.textSecondary, fontWeight: '600', fontSize: 14 },
});
