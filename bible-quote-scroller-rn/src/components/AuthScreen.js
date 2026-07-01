import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/SupabaseClient';
import { COLORS, FONTS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {

  const handleOAuthLogin = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: 'biblescroller://login-callback',
      }
    });

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      console.log('OAuth URL launched:', data?.url);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <Text style={styles.logoMark}>✦</Text>
          <Text style={styles.title}>Sanctum</Text>
          <Text style={styles.subtitle}>
            Save your verses, connect with friends,{'\n'}and preserve your algorithm.
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.buttonContainer} onPress={() => handleOAuthLogin('google')}>
            <Ionicons name="logo-google" size={22} color={COLORS.textPrimary} style={styles.icon} />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonContainer} onPress={() => handleOAuthLogin('facebook')}>
            <Ionicons name="logo-facebook" size={22} color={COLORS.textPrimary} style={styles.icon} />
            <Text style={styles.buttonText}>Continue with Facebook</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 32,
  },
  logoArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoMark: {
    fontSize: 40,
    color: COLORS.accentGold,
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 38,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: 12,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.sansBold,
  },
  icon: {
    position: 'absolute',
    left: 20,
  },
  legal: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
