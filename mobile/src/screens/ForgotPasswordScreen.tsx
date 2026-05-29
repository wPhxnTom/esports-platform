import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../utils/theme';
import api from '../api/client';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSend() {
    if (!email) { setError('Enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/password-reset/forgot', { email });
      router.push({ pathname: '/verify-code', params: { email, code: res.data.code } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.form}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a verification code.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSend} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>SEND CODE</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.linkWrap}>
          <Text style={styles.linkText}>Back to login</Text>
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
  linkWrap: { alignItems: 'center', marginTop: 24 },
  linkText: { color: t.textMuted, fontSize: 14, fontWeight: '600' },
});
