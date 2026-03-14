// ============================================================
// AuthService — Supabase Authentication
//
// Handles signup, login (email + OAuth), logout, and profile
// management. On login, merges in-memory session weights with
// the stored profile weights so personalization carries over.
// ============================================================

import { supabase } from '../config/supabaseClient';
import { getWeights, loadWeights } from './AlgorithmService';
import { saveProfile, clearAllCaches } from './CacheManager';
import type { Profile } from '../types';

/**
 * Sign up a new user with email and password.
 * Creates a row in the `profiles` table and merges session weights.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<Profile> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Signup succeeded but no user returned');

  const userId = authData.user.id;
  const currentWeights = getWeights();

  const profile: Omit<Profile, 'created_at' | 'qr_code_token'> = {
    id: userId,
    display_name: displayName,
    username: null,
    avatar_url: null,
    narrator_voice: 'Rachel',
    theme: 'dark',
    weights: currentWeights,
  };

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (profileError) throw new Error(profileError.message);

  const fullProfile = profileData as Profile;
  await saveProfile(fullProfile);
  return fullProfile;
}

/**
 * Sign in with email and password.
 * Merges stored weights into the current session.
 */
export async function signIn(email: string, password: string): Promise<Profile> {
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Login succeeded but no user returned');

  return await fetchAndSyncProfile(authData.user.id);
}

/**
 * Sign in with OAuth provider (Google, Facebook, Apple).
 * Returns a URL that should be opened in the system browser.
 */
export async function signInWithOAuth(
  provider: 'google' | 'facebook' | 'apple'
): Promise<string> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: 'sanctum://auth/callback',
    },
  });

  if (error) throw new Error(error.message);
  return data.url;
}

/**
 * Sign out and clear all local caches.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  await clearAllCaches();
}

/**
 * Get the currently authenticated user's profile, or null if guest.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

/**
 * Update the user's profile fields.
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'username' | 'avatar_url' | 'narrator_voice' | 'theme'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const profile = data as Profile;
  await saveProfile(profile);
  return profile;
}

/**
 * Fetch profile from Supabase and merge weights into session.
 */
async function fetchAndSyncProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Profile not found');

  const profile = data as Profile;

  // Merge stored weights into session algorithm
  if (profile.weights && Object.keys(profile.weights).length > 0) {
    loadWeights(profile.weights);
  }

  // Save session weights back to profile (merge guest + stored)
  const mergedWeights = getWeights();
  await supabase
    .from('profiles')
    .update({ weights: mergedWeights })
    .eq('id', userId);

  profile.weights = mergedWeights;
  await saveProfile(profile);
  return profile;
}

/**
 * Listen for auth state changes (login, logout, token refresh).
 */
export function onAuthStateChange(
  callback: (profile: Profile | null) => void
): { unsubscribe: () => void } {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (session?.user) {
        try {
          const profile = await fetchAndSyncProfile(session.user.id);
          callback(profile);
        } catch {
          callback(null);
        }
      } else {
        callback(null);
      }
    }
  );

  return { unsubscribe: () => subscription.unsubscribe() };
}
