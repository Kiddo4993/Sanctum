// ============================================================
// Tab Layout — Bottom tab navigator
// ============================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../src/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>{label}</Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accentGold,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="✝" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused }) => <TabIcon label="★" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="⚙" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopColor: COLORS.tabBarBorder,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
  },
  icon: {
    fontSize: 22,
    color: COLORS.textMuted,
  },
  iconFocused: {
    color: COLORS.accentGold,
  },
});
