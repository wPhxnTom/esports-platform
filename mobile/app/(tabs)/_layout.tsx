import React from 'react';
import { Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/utils/theme';

export default function TabLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen name="index" options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, focused }) => <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: focused ? theme.primary + '20' : 'transparent', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 16, opacity: focused ? 1 : 0.6 }}>🗺️</Text></View>,
      }} />
      <Tabs.Screen name="weapons" options={{
        tabBarLabel: 'Weapons',
        tabBarIcon: ({ color, focused }) => <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: focused ? theme.primary + '20' : 'transparent', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 16, opacity: focused ? 1 : 0.6 }}>🔫</Text></View>,
      }} />
      <Tabs.Screen name="matches" options={{
        tabBarLabel: 'Matches',
        tabBarIcon: ({ color, focused }) => <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: focused ? theme.primary + '20' : 'transparent', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 16, opacity: focused ? 1 : 0.6 }}>🎯</Text></View>,
      }} />
      <Tabs.Screen name="leaderboard" options={{
        tabBarLabel: 'Rankings',
        tabBarIcon: ({ color, focused }) => <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: focused ? theme.primary + '20' : 'transparent', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 16, opacity: focused ? 1 : 0.6 }}>🏆</Text></View>,
      }} />
      <Tabs.Screen name="notifications" options={{
        tabBarLabel: 'Alerts',
        tabBarIcon: ({ color, focused }) => <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: focused ? theme.primary + '20' : 'transparent', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 16, opacity: focused ? 1 : 0.6 }}>⚡</Text></View>,
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, focused }) => <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: focused ? theme.primary + '20' : 'transparent', justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 16, opacity: focused ? 1 : 0.6 }}>👤</Text></View>,
      }} />
    </Tabs>
  );
}
