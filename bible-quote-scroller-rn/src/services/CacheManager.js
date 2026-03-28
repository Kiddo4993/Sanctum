// ============================================================
// CacheManager — AsyncStorage-backed local device cache
//
// Strategy: "stale-while-revalidate"
//   → Load cached data immediately on app open (instant UX)
//   → Fetch fresh data from API in the background
//   → Update cache when fresh data arrives
//
// Cached entities:
//   • Recent 20 quotes   (@sanctum/recent_quotes)
//   • Saved quote IDs    (@sanctum/saved_quotes)
//   • Liked quote IDs    (@sanctum/liked_quote_ids)
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Cache Keys ──────────────────────────────────────────────
const KEYS = {
  RECENT_QUOTES: '@sanctum/recent_quotes',
  SAVED_QUOTES: '@sanctum/saved_quotes',
  LIKED_QUOTE_IDS: '@sanctum/liked_quote_ids',
};

const MAX_RECENT_QUOTES = 20;

// ── Generic helpers ─────────────────────────────────────────

async function get(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`[CacheManager] Failed to read key "${key}":`, err);
    return null;
  }
}

async function set(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[CacheManager] Failed to write key "${key}":`, err);
  }
}

async function remove(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn(`[CacheManager] Failed to remove key "${key}":`, err);
  }
}

// ── Recent Quotes ───────────────────────────────────────────

export async function loadRecentQuotes() {
  const entry = await get(KEYS.RECENT_QUOTES);
  return entry?.data ?? [];
}

export async function addRecentQuote(quote) {
  const existing = await loadRecentQuotes();
  const filtered = existing.filter((q) => q.id !== quote.id);
  const updated = [...filtered, quote].slice(-MAX_RECENT_QUOTES);
  const entry = {
    data: updated,
    cachedAt: new Date().toISOString(),
  };
  await set(KEYS.RECENT_QUOTES, entry);
}

/**
 * Replace the entire recent quotes cache (used during background refresh).
 */
export async function saveRecentQuotes(quotes) {
  const entry = {
    data: quotes.slice(-MAX_RECENT_QUOTES),
    cachedAt: new Date().toISOString(),
  };
  await set(KEYS.RECENT_QUOTES, entry);
}

// ── Saved Quotes ────────────────────────────────────────────

export async function loadSavedQuoteIds() {
  const entry = await get(KEYS.SAVED_QUOTES);
  return entry?.data ?? [];
}

export async function saveSavedQuoteIds(ids) {
  const entry = {
    data: ids,
    cachedAt: new Date().toISOString(),
  };
  await set(KEYS.SAVED_QUOTES, entry);
}

// ── Liked Quotes ────────────────────────────────────────────

export async function loadLikedQuoteIds() {
  const entry = await get(KEYS.LIKED_QUOTE_IDS);
  return entry?.data ?? [];
}

export async function saveLikedQuoteIds(ids) {
  const entry = {
    data: ids,
    cachedAt: new Date().toISOString(),
  };
  await set(KEYS.LIKED_QUOTE_IDS, entry);
}

// ── Utilities ───────────────────────────────────────────────

export async function clearAllCaches() {
  const allKeys = Object.values(KEYS);
  try {
    await AsyncStorage.multiRemove(allKeys);
  } catch (err) {
    console.warn('[CacheManager] Failed to clear caches:', err);
  }
}

export { KEYS, get as getRaw, set as setRaw, remove as removeRaw };
