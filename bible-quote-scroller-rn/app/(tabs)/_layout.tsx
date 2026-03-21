// ============================================================
// Tab Layout — Bottom tab navigator
// ============================================================

import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accentPlatinum,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={24} color={color} />
          ),
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
    height: 85,
    paddingBottom: 25,
    paddingTop: 10,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
});

