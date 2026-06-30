import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../services/SupabaseClient';
import { COLORS, FONTS } from '../theme';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export default function UsernameSetupScreen({ userId, onComplete }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const trimmed = username.trim().toLowerCase();
    if (!USERNAME_RE.test(trimmed)) {
      setError('Username must be 3–30 characters: letters, numbers, and underscores only.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: userId, username: trimmed }, { onConflict: 'id' });

    if (upsertError) {
      const msg = upsertError.code === '23505'
        ? 'That username is already taken. Please try another.'
        : 'Could not save username. Please try again.';
      setError(msg);
      setLoading(false);
      return;
    }

    onComplete();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Choose your username</Text>
        <Text style={styles.subtitle}>
          This is how friends will find and add you in Sanctum.
          You can't change it later, so choose wisely!
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. john_doe"
          placeholderTextColor="#555"
          value={username}
          onChangeText={text => { setUsername(text); setError(''); }}
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          maxLength={30}
          returnKeyType="done"
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.hint}>3–30 characters · letters, numbers, and underscores</Text>

        <TouchableOpacity
          style={[styles.button, (loading || !username.trim()) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || !username.trim()}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 30,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
    marginBottom: 36,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontFamily: FONTS.sans,
    fontSize: 18,
    marginBottom: 8,
  },
  error: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: '#FF6B6B',
    marginBottom: 8,
  },
  hint: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: '#555',
    marginBottom: 32,
  },
  button: {
    backgroundColor: COLORS.accentGold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: FONTS.sans,
    fontWeight: '600',
    fontSize: 17,
    color: '#000',
  },
});
