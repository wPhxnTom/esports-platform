import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../utils/theme';

interface QuickStatProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

export default function QuickStat({ label, value, icon, color }: QuickStatProps) {
  const { theme } = useTheme();
  const effectiveColor = color || theme.primaryLight;
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={[styles.card, { borderTopColor: effectiveColor }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: effectiveColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (t: any) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: t.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 2,
  },
  icon: { fontSize: 20, marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 11, color: t.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
});
