// ============================================================
// CacheManager — AsyncStorage-backed local device cache
//
// Strategy: "stale-while-revalidate"
//   → Load cached data immediately on app open (instant UX)
//   → Fetch fresh data from Supabase in the background
//   → Update cache when fresh data arrives
//
// Cached entities:
//   • Recent 20 quotes   (@sanctum/recent_quotes)
//   • User profile        (@sanctum/user_profile)
//   • Saved quote IDs     (@sanctum/saved_quotes)
//   • Liked quote IDs     (@sanctum/liked_quote_ids)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Quote, Profile, CacheEntry } from '../types';

// ── Cache Keys ──────────────────────────────────────────────
const KEYS = {
  RECENT_QUOTES: '@sanctum/recent_quotes',
  USER_PROFILE: '@sanctum/user_profile',
  SAVED_QUOTES: '@sanctum/saved_quotes',
  LIKED_QUOTE_IDS: '@sanctum/liked_quote_ids',
} as const;

const MAX_RECENT_QUOTES = 20;

// ── Generic helpers ─────────────────────────────────────────

/**
 * Read a JSON value from AsyncStorage.
 * Returns null if the key doesn't exist or can't be parsed.
 */
async function get<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.warn(`[CacheManager] Failed to read key "${key}":`, err);
    return null;
  }
}

/**
 * Write a JSON value to AsyncStorage.
 */
async function set<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[CacheManager] Failed to write key "${key}":`, err);
  }
}

/**
 * Remove a key from AsyncStorage.
 */
async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn(`[CacheManager] Failed to remove key "${key}":`, err);
  }
}

// ── Recent Quotes ───────────────────────────────────────────

/**
 * Load the most recent cached quotes (up to 20).
 */
export async function loadRecentQuotes(): Promise<Quote[]> {
  const entry = await get<CacheEntry<Quote[]>>(KEYS.RECENT_QUOTES);
  return entry?.data ?? [];
}

/**
 * Append a quote to the recent quotes cache.
 * Trims the list to the newest MAX_RECENT_QUOTES.
 */
export async function addRecentQuote(quote: Quote): Promise<void> {
  const existing = await loadRecentQuotes();
  // Avoid duplicates
  const filtered = existing.filter((q) => q.id !== quote.id);
  const updated = [...filtered, quote].slice(-MAX_RECENT_QUOTES);
  const entry: CacheEntry<Quote[]> = {
    data: updated,
    cachedAt: new Date().toISOString(),
    expiresAt: null, // never expires — always show something
  };
  await set(KEYS.RECENT_QUOTES, entry);
}

/**
 * Replace the entire recent quotes cache (used during background refresh).
 */
export async function saveRecentQuotes(quotes: Quote[]): Promise<void> {
  const entry: CacheEntry<Quote[]> = {
    data: quotes.slice(-MAX_RECENT_QUOTES),
    cachedAt: new Date().toISOString(),
    expiresAt: null,
  };
  await set(KEYS.RECENT_QUOTES, entry);
}

// ── User Profile ────────────────────────────────────────────

export async function loadProfile(): Promise<Profile | null> {
  const entry = await get<CacheEntry<Profile>>(KEYS.USER_PROFILE);
  return entry?.data ?? null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  const entry: CacheEntry<Profile> = {
    data: profile,
    cachedAt: new Date().toISOString(),
    expiresAt: null,
  };
  await set(KEYS.USER_PROFILE, entry);
}

// ── Saved Quotes ────────────────────────────────────────────

export async function loadSavedQuoteIds(): Promise<string[]> {
  const entry = await get<CacheEntry<string[]>>(KEYS.SAVED_QUOTES);
  return entry?.data ?? [];
}

export async function saveSavedQuoteIds(ids: string[]): Promise<void> {
  const entry: CacheEntry<string[]> = {
    data: ids,
    cachedAt: new Date().toISOString(),
    expiresAt: null,
  };
  await set(KEYS.SAVED_QUOTES, entry);
}

// ── Liked Quotes ────────────────────────────────────────────

export async function loadLikedQuoteIds(): Promise<string[]> {
  const entry = await get<CacheEntry<string[]>>(KEYS.LIKED_QUOTE_IDS);
  return entry?.data ?? [];
}

export async function saveLikedQuoteIds(ids: string[]): Promise<void> {
  const entry: CacheEntry<string[]> = {
    data: ids,
    cachedAt: new Date().toISOString(),
    expiresAt: null,
  };
  await set(KEYS.LIKED_QUOTE_IDS, entry);
}

// ── Utilities ───────────────────────────────────────────────

/**
 * Nuke all Sanctum caches. Use on logout.
 */
export async function clearAllCaches(): Promise<void> {
  const allKeys = Object.values(KEYS);
  try {
    await AsyncStorage.multiRemove(allKeys);
  } catch (err) {
    console.warn('[CacheManager] Failed to clear caches:', err);
  }
}

export { KEYS, get as getRaw, set as setRaw, remove as removeRaw };
