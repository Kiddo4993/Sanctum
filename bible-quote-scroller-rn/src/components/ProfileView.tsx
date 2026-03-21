// ============================================================
// Profile Screen — User settings and QR code
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import {
  getCurrentProfile,
  updateProfile,
  signOut,
} from '../../src/services/AuthService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/theme';
import type { Profile } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    async function load() {
      const p = await getCurrentProfile();
      setProfile(p);
      if (p) {
        setDisplayName(p.display_name);
        setUsername(p.username || '');
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const updated = await updateProfile(profile.id, {
        display_name: displayName,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      });
      setProfile(updated);
      setEditing(false);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (loading && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accentPlatinum} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.header}>Profile</Text>
        <Text style={styles.info}>Sign in to customize your Sanctuary.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.btnText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/auth/signup')}>
          <Text style={styles.outlineBtnText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const qrValue = `sanctum://add-friend/${profile.qr_code_token}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.card}>
        {editing ? (
          <View style={styles.form}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.name}>{profile.display_name}</Text>
              <Text style={styles.username}>@{profile.username || 'set_username'}</Text>
            </View>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.qrCard}>
        <Text style={styles.qrTitle}>Your Friend Code</Text>
        <Text style={styles.qrDesc}>Have a friend scan this with their camera.</Text>
        <View style={styles.qrWrapper}>
          <QRCode
            value={qrValue}
            size={200}
            color={COLORS.textPrimary}
            backgroundColor={COLORS.card}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.outlineBtn} onPress={handleSignOut}>
        <Text style={styles.dangerText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  header: { fontFamily: FONTS.serif, fontSize: 28, color: COLORS.textPrimary, marginBottom: SPACING.xl },
  card: { backgroundColor: COLORS.card, padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SPACING.xl },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: FONTS.sansBold, fontSize: 20, color: COLORS.textPrimary },
  username: { fontFamily: FONTS.sans, fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  editText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.accentPlatinum },
  form: { gap: SPACING.sm },
  label: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  input: { height: 48, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, color: COLORS.textPrimary, fontFamily: FONTS.sans, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SPACING.md },
  primaryBtn: { backgroundColor: COLORS.accentPlatinum, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  btnText: { fontFamily: FONTS.sansBold, fontSize: 16, color: '#000' },
  outlineBtn: { backgroundColor: 'transparent', paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginTop: SPACING.sm, width: '100%' },
  outlineBtnText: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.textPrimary },
  dangerText: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.danger },
  qrCard: { backgroundColor: COLORS.card, padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.borderLight, marginBottom: SPACING.xl, alignItems: 'center' },
  qrTitle: { fontFamily: FONTS.sansBold, fontSize: 18, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  qrDesc: { fontFamily: FONTS.sans, fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.xl, textAlign: 'center' },
  qrWrapper: { padding: SPACING.md, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.borderLight },
  info: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
});
