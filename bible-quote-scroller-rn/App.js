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
import {
  Cinzel_600SemiBold
} from '@expo-google-fonts/cinzel';

import ScrollFeed from './src/components/ScrollFeed';
import EyeRestBanner from './src/components/EyeRestBanner';
import NavBar from './src/components/NavBar';
import SavedScreen from './src/components/SavedScreen';
import SignInScreen from './src/components/SignInScreen';
import CreateAccountScreen from './src/components/CreateAccountScreen';
import OnboardingScreen from './src/components/OnboardingScreen';
import DiscoveryScreen from './src/components/DiscoveryScreen';
import ProfileScreen from './src/components/ProfileScreen';
import { COLORS, FONTS } from './src/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [authScreen, setAuthScreen] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          Inter_400Regular,
          Inter_600SemiBold,
          Lora_400Regular,
          Lora_400Regular_Italic,
          Cinzel_600SemiBold,
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

  // Auth screens
  if (authScreen === null) {
    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        <SignInScreen
          onNavigateToCreate={() => setAuthScreen('create')}
          onSignedIn={() => setAuthScreen('authenticated')}
        />
      </View>
    );
  }

  if (authScreen === 'create') {
    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        <CreateAccountScreen
          onNavigateToSignIn={() => setAuthScreen(null)}
          onAccountCreated={(userData) => {
            setUser(userData);
            setAuthScreen('onboarding');
          }}
        />
      </View>
    );
  }

  if (authScreen === 'onboarding') {
    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        <OnboardingScreen
          onContinue={(reasons) => {
            setUser(prev => ({ ...prev, reasons }));
            setAuthScreen('discovery');
          }}
        />
      </View>
    );
  }

  if (authScreen === 'discovery') {
    return (
      <View style={styles.container} onLayout={onLayoutRootView}>
        <DiscoveryScreen
          onContinue={(sources) => {
            setUser(prev => ({ ...prev, sources }));
            setAuthScreen('authenticated');
          }}
        />
      </View>
    );
  }

  // Main app
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
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            onSignOut={() => {
              setUser(null);
              setAuthScreen(null);
            }}
          />
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
