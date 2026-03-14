// ============================================================
// Auth Signup Screen
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signUp } from '../../src/services/AuthService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, displayName);
      router.replace('/(tabs)/');
    } catch (e: any) {
      Alert.alert('Signup Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Sanctuary</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Sign Up</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Log in.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.xl, justifyContent: 'center' },
  header: { fontFamily: FONTS.serif, fontSize: 32, color: COLORS.textPrimary, marginBottom: SPACING.xxl, textAlign: 'center' },
  form: { gap: SPACING.md },
  label: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  input: { height: 52, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, color: COLORS.textPrimary, fontFamily: FONTS.sans, borderWidth: 1, borderColor: COLORS.borderLight, fontSize: 16 },
  primaryBtn: { backgroundColor: COLORS.accentGold, paddingVertical: 16, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.lg },
  btnText: { fontFamily: FONTS.sansBold, fontSize: 16, color: '#000' },
  link: { alignItems: 'center', marginTop: SPACING.lg },
  linkText: { fontFamily: FONTS.sans, fontSize: 14, color: COLORS.textSecondary },
});
