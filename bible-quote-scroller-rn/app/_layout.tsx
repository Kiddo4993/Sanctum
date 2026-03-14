// ============================================================
// Root Layout — App entry point (Expo Router)
//
// Loads custom fonts, manages splash screen, wraps app
// in a dark-themed SafeAreaProvider.
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
} from '@expo-google-fonts/lora';
import { COLORS } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          Inter_400Regular,
          Inter_600SemiBold,
          Lora_400Regular,
          Lora_400Regular_Italic,
        });
      } catch (e) {
        console.warn('Font loading failed:', e);
      } finally {
        setReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutReady = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={styles.root} onLayout={onLayoutReady}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});
