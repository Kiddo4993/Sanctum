import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Inter_400Regular,
  Inter_600SemiBold
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_400Regular_Italic
} from '@expo-google-fonts/lora';

import ScrollFeed from './src/components/ScrollFeed';
import EyeRestBanner from './src/components/EyeRestBanner';
import NavBar from './src/components/NavBar';
import SavedScreen from './src/components/SavedScreen';
import { COLORS, FONTS } from './src/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

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
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <ScrollFeed />
            <EyeRestBanner />
          </>
        );
      case 'saved':
        return <SavedScreen />;
      case 'friends':
      case 'profile':
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Coming soon</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      {renderScreen()}
      <NavBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontFamily: FONTS.sans,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
  },
});
