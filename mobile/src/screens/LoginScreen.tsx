import { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../utils/theme';
import Logo from '../components/Logo';

export default function LoginScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  async function handleLogin() {
    if (!email) { setError('Enter your email'); return; }
    if (!password) { setError('Enter your password'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require('../../assets/images/banner-battleroyale.png')}
      style={styles.bg}
      imageStyle={{ opacity: 0.25 }}
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topSection}>
          <Logo size="lg" showTagline />
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign In</Text>

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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={theme.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>SIGN IN</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkWrap}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  bg: { flex: 1, backgroundColor: t.background },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,8,0.85)' },
  container: { flex: 1 },
  topSection: { paddingTop: 80, paddingBottom: 20 },
  form: { flex: 1, paddingHorizontal: 28, paddingTop: 20 },
  formTitle: { fontSize: 28, fontWeight: '900', color: t.text, marginBottom: 28, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '800', color: t.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
    color: t.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  button: {
    backgroundColor: t.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  error: { color: t.error, fontSize: 13, textAlign: 'center', marginBottom: 8, backgroundColor: 'rgba(239,68,68,0.15)', padding: 10, borderRadius: 8 },
  forgotWrap: { alignItems: 'flex-end', marginTop: 4, marginBottom: 4 },
  forgotText: { color: t.textMuted, fontSize: 13, fontWeight: '600' },
  linkWrap: { alignItems: 'center', marginTop: 24 },
  linkText: { color: t.textSecondary, fontSize: 14 },
  linkHighlight: { color: t.primary, fontWeight: '800' },
});
