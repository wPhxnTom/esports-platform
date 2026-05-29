import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Storage from '../utils/storage';

export const darkTheme = {
  background: '#050508',
  surface: '#0d0d14',
  surfaceLight: '#181825',
  primary: '#f97316',
  primaryLight: '#fb923c',
  secondary: '#eab308',
  accent: '#f59e0b',
  success: '#22c55e',
  error: '#ef4444',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.08)',
  gold: '#fbbf24',
  silver: '#94a3b8',
  bronze: '#d97706',
};

export const lightTheme = {
  background: '#f1f5f9',
  surface: '#ffffff',
  surfaceLight: '#e2e8f0',
  primary: '#ea580c',
  primaryLight: '#f97316',
  secondary: '#ca8a04',
  accent: '#d97706',
  success: '#16a34a',
  error: '#dc2626',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#cbd5e1',
  gold: '#ca8a04',
  silver: '#64748b',
  bronze: '#92400e',
};

type Theme = typeof darkTheme;

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    Storage.getItem('theme').then((val) => {
      if (val === 'light') setIsDark(false);
    });
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await Storage.setItem('theme', next ? 'dark' : 'light');
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
