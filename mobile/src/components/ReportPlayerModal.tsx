import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { useTheme } from '../utils/theme';
import api from '../api/client';

interface Props {
  visible: boolean;
  onClose: () => void;
  matchId: string;
  targetId: string;
  targetPseudo: string;
}

export default function ReportPlayerModal({ visible, onClose, matchId, targetId, targetPseudo }: Props) {
  const { theme } = useTheme();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = ['Cheating', 'Team Farming', 'Toxicity', 'Match Fixing', 'Other'];

  async function handleSubmit() {
    if (!reason) { Alert.alert('Error', 'Please select a reason'); return; }
    setSubmitting(true);
    try {
      await api.post('/anti-cheat/report/match', { matchId, targetId, reason, description });
      Alert.alert('Report Submitted', 'Our team will review this report.');
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to submit report');
    } finally { setSubmitting(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: theme.surface }]}>
          <Text style={[s.title, { color: theme.text }]}>Report Player</Text>
          <Text style={[s.subtitle, { color: theme.textSecondary }]}>Reporting: {targetPseudo}</Text>

          <Text style={[s.label, { color: theme.textSecondary }]}>Reason</Text>
          <View style={s.reasonRow}>
            {reasons.map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.reasonChip, reason === r && { backgroundColor: theme.error }]}
                onPress={() => setReason(r)}
              >
                <Text style={[s.reasonText, { color: reason === r ? '#fff' : theme.text }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { color: theme.textSecondary }]}>Details (optional)</Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Describe what happened..."
            placeholderTextColor={theme.textMuted}
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <View style={s.actions}>
            <TouchableOpacity style={[s.btn, { backgroundColor: theme.error }]} onPress={handleSubmit} disabled={submitting}>
              <Text style={s.btnText}>{submitting ? 'Submitting...' : 'Submit Report'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: theme.surfaceLight }]} onPress={onClose}>
              <Text style={[s.btnText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  card: { borderRadius: 16, padding: 20, maxHeight: '90%' },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reasonChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ffffff30' },
  reasonText: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 80, fontSize: 14, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
