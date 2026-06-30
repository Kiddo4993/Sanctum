import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './src/services/SupabaseClient';
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
import AuthScreen from './src/components/AuthScreen';
import FriendsScreen from './src/components/FriendsScreen';
import ProfileScreen from './src/components/ProfileScreen';
import PaywallScreen from './src/components/PaywallScreen';
import UsernameSetupScreen from './src/components/UsernameSetupScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import { COLORS } from './src/theme';
import { promoteSessionWeights } from './src/services/AlgorithmService';
import { resetLikeServiceCache } from './src/services/LikeService';

SplashScreen.preventAutoHideAsync();

const FREE_SCROLL_LIMIT = 20;
const USERNAME_RE = /^[a-zA-Z0-9_]{1,30}$/;

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [needsUsername, setNeedsUsername] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [scrollCount, setScrollCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState('scroll_limit');

  // is_premium is read from app_metadata (admin-only writable, not user-writable)
  const isPremium = session?.user?.app_metadata?.is_premium ?? false;

  const onScrollIncrement = useCallback(() => {
    if (isPremium) return;
    setScrollCount(prev => {
      const next = prev + 1;
      if (next >= FREE_SCROLL_LIMIT) {
        setPaywallReason('scroll_limit');
        setShowPaywall(true);
      }
      return next;
    });
  }, [isPremium]);

  const handleTabPress = useCallback((tab) => {
    if ((tab === 'friends' || tab === 'profile') && !session) {
      setPaywallReason('feature');
      setShowPaywall(true);
      return;
    }
    setActiveTab(tab);
  }, [session]);

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

    // Auth state listener — source of truth for session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess ?? null);

      if (event === 'SIGNED_IN' && sess?.user?.id) {
        promoteSessionWeights(sess.user.id).catch(console.warn);

        // Check if user has set a username yet
        supabase.from('profiles')
          .select('username')
          .eq('id', sess.user.id)
          .single()
          .then(({ data }) => {
            if (!data?.username) setNeedsUsername(true);
          })
          .catch(console.warn);
      }

      if (event === 'SIGNED_OUT') {
        resetLikeServiceCache();
        setNeedsUsername(false);
        setScrollCount(0);
      }
    });

    // Get the current session on mount
    supabase.auth.getSession()
      .then(({ data }) => setSession(data.session ?? null))
      .catch(() => setSession(null));

    // Deep-link handling
    const handleDeepLink = (event) => {
      const url = event?.url;
      if (!url) return;
      if (url.includes('biblescroller://add-friend/')) {
        const raw = url.split('biblescroller://add-friend/')[1] ?? '';
        const username = raw.split('?')[0].split('#')[0].replace(/\/+$/, '');
        if (!USERNAME_RE.test(username)) return;
        promptAddFriend(username);
      }
    };

    Linking.getInitialURL()
      .then(url => { if (url) handleDeepLink({ url }); })
      .catch(console.warn);

    const linkSub = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  const promptAddFriend = (friendUsername) => {
    Alert.alert(
      'Friend Link Detected!',
      `Would you like to add @${friendUsername} as a friend?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const myUserId = sessionData?.session?.user?.id;
            if (!myUserId) {
              return Alert.alert('Error', 'You must be logged in to add friends.');
            }
            const { data: friendProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('username', friendUsername)
              .single();
            if (!friendProfile) {
              return Alert.alert('Not Found', `User @${friendUsername} could not be found.`);
            }
            if (friendProfile.id === myUserId) {
              return Alert.alert('Oops', "You can't add yourself as a friend.");
            }
            const { error } = await supabase
              .from('friends')
              .insert({ user_id: myUserId, friend_id: friendProfile.id });
            if (error) {
              return Alert.alert('Error', 'Could not add friend. You may already be friends.');
            }
            Alert.alert('Success', `You are now friends with @${friendUsername}!`);
          }
        }
      ]
    );
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady || session === undefined) return null;

  // Unauthenticated: show auth screen
  if (session === null) {
    return (
      <ErrorBoundary>
        <View style={styles.container} onLayout={onLayoutRootView}>
          <AuthScreen />
        </View>
      </ErrorBoundary>
    );
  }

  // First-time login: user hasn't set a username yet
  if (needsUsername) {
    return (
      <ErrorBoundary>
        <View style={styles.container} onLayout={onLayoutRootView}>
          <UsernameSetupScreen
            userId={session.user.id}
            onComplete={() => setNeedsUsername(false)}
          />
        </View>
      </ErrorBoundary>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <ScrollFeed onScrollIncrement={onScrollIncrement} isPremium={isPremium} />
            <EyeRestBanner />
          </>
        );
      case 'saved':
        return <SavedScreen />;
      case 'friends':
        return <FriendsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <View style={styles.container} onLayout={onLayoutRootView}>
        {renderScreen()}
        <NavBar activeTab={activeTab} onTabPress={handleTabPress} />
        <PaywallScreen
          visible={showPaywall}
          reason={paywallReason}
          onClose={() => setShowPaywall(false)}
          onSubscribe={() => {
            // TODO: integrate RevenueCat / expo-in-app-purchases
            setShowPaywall(false);
            Alert.alert('Coming Soon', 'In-app purchase will be available at launch.');
          }}
        />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
