import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../services/SupabaseClient';
import { COLORS, FONTS } from '../theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function fetchProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (userId) {
        let { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!data?.username) {
          data = { ...data, username: sessionData.session.user.email?.split('@')[0] || 'friend' };
        }
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accentGold} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Please log in to view your profile and QR code.</Text>
      </View>
    );
  }

  const qrValue = `biblescroller://add-friend/${profile.username}`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Your Profile</Text>
      <Text style={styles.subtitle}>@{profile.username}</Text>

      <View style={styles.qrContainer}>
        <QRCode value={qrValue} size={200} color={COLORS.background} backgroundColor="#FFFFFF" />
      </View>
      <Text style={styles.instruction}>Have a friend scan this code to connect!</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  text: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
    fontSize: 16,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    color: COLORS.accentGold,
    marginBottom: 48,
  },
  qrContainer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  instruction: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
