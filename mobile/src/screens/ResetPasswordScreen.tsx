import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../utils/theme';
import api from '../api/client';

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { email, code } = useLocalSearchParams<{ email: string; code: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleReset() {
    if (!password) { setError('Enter a new password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/password-reset/reset', { email, code, password });
      router.replace('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.form}>
        <Text style={styles.title}>New password</Text>
        <Text style={styles.subtitle}>Choose a strong password for your account.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 6 characters"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat your password"
            placeholderTextColor={theme.textMuted}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>RESET PASSWORD</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.background },
  form: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: t.text, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: t.textSecondary, marginBottom: 32, lineHeight: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '800', color: t.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, color: t.text, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  button: { backgroundColor: t.primary, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 12, shadowColor: t.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  error: { color: t.error, fontSize: 13, textAlign: 'center', marginBottom: 8, backgroundColor: 'rgba(239,68,68,0.15)', padding: 10, borderRadius: 8 },
});
