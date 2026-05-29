import { useState, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../utils/theme';
import api from '../api/client';

export default function VerifyCodeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { email, code: initialCode } = useLocalSearchParams<{ email: string; code: string }>();
  const router = useRouter();
  const [code, setCode] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  async function handleVerify() {
    if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/password-reset/verify', { email, code });
      router.push({ pathname: '/reset-password', params: { email, code } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.form}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            ref={inputRef}
            style={styles.codeInput}
            placeholder="000000"
            placeholderTextColor={theme.textMuted}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>VERIFY CODE</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.linkWrap}>
          <Text style={styles.linkText}>Back</Text>
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
  codeInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, color: t.text, fontSize: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', textAlign: 'center', letterSpacing: 10 },
  button: { backgroundColor: t.primary, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 12, shadowColor: t.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  error: { color: t.error, fontSize: 13, textAlign: 'center', marginBottom: 8, backgroundColor: 'rgba(239,68,68,0.15)', padding: 10, borderRadius: 8 },
  linkWrap: { alignItems: 'center', marginTop: 24 },
  linkText: { color: t.textMuted, fontSize: 14, fontWeight: '600' },
});
