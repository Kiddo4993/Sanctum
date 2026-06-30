import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../services/SupabaseClient';
import { COLORS, FONTS } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {

  const handleOAuthLogin = async (provider) => {
    // In React Native Expo, make sure the redirectUrl is configured properly in Supabase dashboard
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: 'biblescroller://login-callback', // Adjust this scheme
      }
    });

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      // Handled automatically by supabase instance if url is caught by linking
      console.log('OAuth URL launched:', data?.url);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Sanctum</Text>
      <Text style={styles.subtitle}>Save your verses, connect with friends, and preserve your algorithm.</Text>
      
      <TouchableOpacity style={styles.buttonContainer} onPress={() => handleOAuthLogin('google')}>
        <Ionicons name="logo-google" size={24} color={COLORS.textPrimary} style={styles.icon} />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonContainer} onPress={() => handleOAuthLogin('facebook')}>
        <Ionicons name="logo-facebook" size={24} color={COLORS.textPrimary} style={styles.icon} />
        <Text style={styles.buttonText}>Continue with Facebook</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 32,
    color: '#F0F0F0',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    color: '#888888',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'center'
  },
  buttonText: {
    color: '#F0F0F0',
    fontSize: 18,
    fontFamily: FONTS.sans,
    fontWeight: '600',
  },
  icon: {
    position: 'absolute',
    left: 24,
  }
});
