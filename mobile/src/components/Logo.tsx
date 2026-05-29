import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../utils/theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export default function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fontSize = size === 'sm' ? 18 : size === 'lg' ? 36 : 26;
  const wh = size === 'sm' ? 48 : size === 'lg' ? 96 : 72;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { width: wh, height: wh }]}>
        <Image source={require('../../assets/images/logo.png')} style={[styles.icon, { width: wh - 8, height: wh - 8 }]} />
      </View>
      <Text style={[styles.title, { fontSize }]}>Phxntom</Text>
      {showTagline && (
        <Text style={styles.tagline}>Compete. Rise. Dominate.</Text>
      )}
    </View>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  container: { alignItems: 'center' },
  iconWrapper: {
    borderRadius: 20,
    backgroundColor: t.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: t.primary,
    shadowColor: t.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: { resizeMode: 'contain' },
  title: {
    fontWeight: '900',
    color: t.text,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: t.textSecondary,
    marginTop: 4,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
