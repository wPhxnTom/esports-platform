import { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../utils/theme';
import Logo from '../components/Logo';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [earlyAccessKey, setEarlyAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  async function handleRegister() {
    if (!pseudo) { setError('Choose a pseudo'); return; }
    if (!email) { setError('Enter your email'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await register(pseudo, email, password, earlyAccessKey || undefined);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require('../../assets/images/banner-killrace.png')}
      style={styles.bg}
      imageStyle={{ opacity: 0.2 }}
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.logoSection}>
            <Logo size="md" />
            <Text style={styles.subtitle}>Join the arena</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pseudo</Text>
              <TextInput
                style={styles.input}
                placeholder="Your gaming name"
                placeholderTextColor={theme.textMuted}
                value={pseudo}
                onChangeText={setPseudo}
                autoCapitalize="none"
              />
            </View>

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
                placeholder="Min 6 characters"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Early Access Key <Text style={{ fontWeight: '400', color: theme.textMuted }}>(optional)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your early access key"
                placeholderTextColor={theme.textMuted}
                value={earlyAccessKey}
                onChangeText={setEarlyAccessKey}
                autoCapitalize="characters"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>CREATE ACCOUNT</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.linkWrap}>
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  bg: { flex: 1, backgroundColor: t.background },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,8,0.85)' },
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  logoSection: { paddingTop: 60, paddingBottom: 12 },
  subtitle: { textAlign: 'center', color: t.textSecondary, fontSize: 14, marginTop: 4 },
  form: { paddingHorizontal: 28, paddingTop: 16 },
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
  linkWrap: { alignItems: 'center', marginTop: 24 },
  linkText: { color: t.textSecondary, fontSize: 14 },
  linkHighlight: { color: t.primary, fontWeight: '800' },
});
