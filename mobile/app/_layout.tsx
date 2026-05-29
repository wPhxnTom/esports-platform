import { useState, useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/utils/theme';
import { ActivityIndicator, View } from 'react-native';
import Onboarding from '../src/components/Onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

function RootLayoutContent() {
  const { theme, isDark } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const prevUser = useRef(user);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (prevUser.current && !user && !loading) {
      router.replace('/login');
    }
    prevUser.current = user;
  }, [user, loading]);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then((val) => {
      if (!val) setShowOnboarding(true);
    }).finally(() => setCheckingOnboarding(false));
  }, []);

  if (loading || checkingOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (showOnboarding && !user) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Onboarding onComplete={async () => {
          await AsyncStorage.setItem('onboarding_done', 'true');
          setShowOnboarding(false);
        }} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        {user ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="login" options={{ animation: 'fade' }} />
            <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
          </>
        )}
        <Stack.Screen name="quick-match" options={{ headerShown: true, headerTitle: 'Quick Match', headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.text }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: true, headerTitle: 'Reset Password', headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.text }} />
        <Stack.Screen name="verify-code" options={{ headerShown: true, headerTitle: 'Verify Code', headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.text }} />
        <Stack.Screen name="reset-password" options={{ headerShown: true, headerTitle: 'New Password', headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.text }} />
        <Stack.Screen name="recharge" options={{ headerShown: true, headerTitle: 'Buy Coins', headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.text }} />
        <Stack.Screen name="create-match" options={{ presentation: 'modal', headerShown: true, headerTitle: 'Create Match', headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.text }} />
        <Stack.Screen name="match/[id]" options={{ headerShown: true, headerTitle: 'Match', headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.text }} />
        <Stack.Screen name="history" options={{ headerShown: true, headerTitle: 'Match History', headerStyle: { backgroundColor: theme.surface }, headerTintColor: theme.text }} />
      </Stack>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
