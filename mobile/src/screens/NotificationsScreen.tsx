import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTheme } from '../utils/theme';
import api from '../api/client';

const getTypeIcons = (t: any) => ({
  MATCH_WIN: { icon: '🏆', color: t.success },
  MATCH_END: { icon: '🎮', color: t.secondary },
  BADGE_EARNED: { icon: '🎖️', color: t.accent },
  CHALLENGE: { icon: '🔥', color: t.error },
});

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const TYPE_ICONS = useMemo(() => getTypeIcons(theme), [theme]);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const r = await api.get('/notifications'); setNotifs(r.data.data || []); setUnread(r.data.unreadCount || 0); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  async function markAllRead() { try { await api.put('/notifications/read-all'); await load(); } catch {} }
  async function markRead(id: string) { try { await api.put(`/notifications/${id}/read`); await load(); } catch {} }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 && <Text style={styles.unreadBadge}>{unread} unread</Text>}
        </View>
        {unread > 0 && (
          <TouchableOpacity style={styles.markBtn} onPress={markAllRead}>
            <Text style={styles.markBtnText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifs}
        renderItem={({ item }) => {
          const td = (TYPE_ICONS as any)[item.type] || { icon: '🔔', color: theme.textMuted };
          return (
            <TouchableOpacity
              style={[styles.card, !item.read && { borderLeftColor: td.color }]}
              onPress={() => !item.read && markRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: td.color + '15' }]}>
                <Text style={styles.cardIcon}>{td.icon}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardDate}>{timeAgo(item.createdAt)}</Text>
              </View>
              {!item.read && <View style={[styles.dot, { backgroundColor: td.color }]} />}
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>You'll see match results and badge unlocks here</Text>
          </View>
        }
      />
    </View>
  );
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  unreadBadge: { fontSize: 12, color: t.primaryLight, fontWeight: '600', marginTop: 2 },
  markBtn: { backgroundColor: t.surfaceLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  markBtnText: { color: t.secondary, fontSize: 12, fontWeight: '700' },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: 12, padding: 14, borderLeftWidth: 2, borderLeftColor: 'transparent' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardIcon: { fontSize: 18 },
  cardContent: { flex: 1 },
  cardMessage: { fontSize: 13, color: t.text, lineHeight: 18 },
  cardDate: { fontSize: 11, color: t.textMuted, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: t.text, marginBottom: 4 },
  emptyText: { fontSize: 13, color: t.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
