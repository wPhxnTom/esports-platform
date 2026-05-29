import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../utils/theme';
import { usePlatformAuth } from '../hooks/usePlatformAuth';
import api from '../api/client';

const PLATFORMS = [
  { key: 'ACTIVISION', label: 'Activision', icon: '☠️', color: '#C8102E', url: 'https://profile.callofduty.com' },
  { key: 'PSN', label: 'PlayStation Network', icon: '🎮', color: '#003791', url: 'https://www.playstation.com' },
  { key: 'XBOX', label: 'Xbox Live', icon: '🟢', color: '#107C10', url: 'https://www.xbox.com' },
  { key: 'STEAM', label: 'Steam', icon: '🖥️', color: '#1b2838', url: 'https://steamcommunity.com' },
  { key: 'BATTLE_NET', label: 'Battle.net', icon: '⚔️', color: '#00AEFF', url: 'https://account.battle.net' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onLinked: () => void;
}

export default function LinkAccountModal({ visible, onClose, onLinked }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { linkingPlatform, linkPlatform } = usePlatformAuth();

  const [manualPlatform, setManualPlatform] = useState('');
  const [gamertag, setGamertag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  async function handlePlatformPress(platform: string) {
    setError('');
    setManualPlatform(platform);

    try {
      const linked = await linkPlatform(platform);
      if (linked) {
        onLinked();
        onClose();
        return;
      }
      setShowManualInput(true);
    } catch (err: any) {
      if (err.response?.data?.manual) {
        setShowManualInput(true);
      } else {
        setError(err.response?.data?.message || 'Failed to initiate link');
      }
    }
  }

  async function handleManualLink() {
    if (!manualPlatform || !gamertag.trim()) {
      setError('Enter your gamertag');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/accounts/link', { platform: manualPlatform, gamertag: gamertag.trim() });
      setManualPlatform('');
      setGamertag('');
      setShowManualInput(false);
      onLinked();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to link account');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setManualPlatform('');
    setGamertag('');
    setError('');
    setShowManualInput(false);
    onClose();
  }

  const platformMeta = PLATFORMS.find(p => p.key === manualPlatform);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            {showManualInput ? `Link ${platformMeta?.label || 'Account'}` : 'Link Platform Account'}
          </Text>
          <Text style={styles.desc}>
            {showManualInput
              ? `Enter your ${platformMeta?.label || ''} username to link manually.`
              : "Choose a platform to connect. You'll be redirected to the official site to authenticate."}
          </Text>

          {showManualInput ? (
            <>
              <Text style={styles.label}>Gamertag / Username</Text>
              <TextInput
                style={styles.input}
                value={gamertag}
                onChangeText={setGamertag}
                placeholder={`Your ${platformMeta?.label || ''} username`}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.linkBtn, { opacity: loading ? 0.6 : 1 }]} onPress={handleManualLink} disabled={loading}>
                  <Text style={styles.linkText}>{loading ? 'Linking...' : 'Link Account'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>Choose a platform</Text>
              <View style={styles.platformRow}>
                {PLATFORMS.map(p => {
                  const isLinking = linkingPlatform === p.key;
                  return (
                    <TouchableOpacity
                      key={p.key}
                      style={[styles.platformChip, { borderColor: theme.border, backgroundColor: theme.background }]}
                      onPress={() => handlePlatformPress(p.key)}
                      disabled={!!linkingPlatform}
                    >
                      {isLinking ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <>
                          <Text style={styles.platformIcon}>{p.icon}</Text>
                          <Text style={styles.platformLabel}>{p.label}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: t.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40, maxHeight: '80%',
  },
  title: { fontSize: 20, fontWeight: '900', color: t.text, marginBottom: 4 },
  desc: { fontSize: 13, color: t.textSecondary, marginBottom: 20, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '700', color: t.textSecondary, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  platformChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1, gap: 8, minWidth: '47%', justifyContent: 'center',
  },
  platformIcon: { fontSize: 18 },
  platformLabel: { fontSize: 12, fontWeight: '600', color: t.text, flexShrink: 1 },
  input: { backgroundColor: t.background, borderRadius: 10, padding: 14, fontSize: 15, color: t.text, borderWidth: 1, borderColor: t.border, marginBottom: 8 },
  error: { color: t.error, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  cancelText: { color: t.textMuted, fontWeight: '600', fontSize: 14 },
  linkBtn: { backgroundColor: t.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  linkText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
