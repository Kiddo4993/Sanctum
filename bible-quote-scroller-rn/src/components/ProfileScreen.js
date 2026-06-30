import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../services/SupabaseClient';
import { COLORS, FONTS } from '../theme';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (userId) {
        let { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        // Fallback for new users without a username yet
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
    <View style={styles.container}>
      <Text style={styles.title}>Your Profile</Text>
      <Text style={styles.subtitle}>@{profile.username}</Text>

      <View style={styles.qrContainer}>
        <QRCode value={qrValue} size={220} color={COLORS.background} backgroundColor="#FFFFFF" />
      </View>
      <Text style={styles.instruction}>Have a friend scan this code to connect!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  text: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
    fontSize: 16
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingTop: 80,
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
    marginBottom: 60,
  },
  qrContainer: {
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 24,
  },
  instruction: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
  }
});
