// ============================================================
// LikeService — Optimistic likes & saves with in-memory cache
//
// Caching strategy:
//   • In-memory Sets for instant isLiked/isSaved lookups
//   • AsyncStorage via CacheManager for liked/saved ID persistence
//   • Full verse data stored in separate AsyncStorage maps
//     (for SavedScreen display)
//   • On first access → load from AsyncStorage into memory
//   • On toggle → update memory + AsyncStorage simultaneously
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadLikedQuoteIds,
  saveLikedQuoteIds,
  loadSavedQuoteIds,
  saveSavedQuoteIds,
} from './CacheManager';

const LIKES_KEY = '@sanctum_liked_verses';
const SAVES_KEY = '@sanctum_saved_verses';

// ── In-memory state (mirrors AsyncStorage for instant access) ──
let likedIdsSet = null;
let savedIdsSet = null;

async function ensureLikedInit() {
  if (likedIdsSet !== null) return;
  const cachedIds = await loadLikedQuoteIds();
  likedIdsSet = new Set(cachedIds);
  console.log(`[LikeService] Loaded ${likedIdsSet.size} liked IDs from cache`);
}

async function ensureSavedInit() {
  if (savedIdsSet !== null) return;
  const cachedIds = await loadSavedQuoteIds();
  savedIdsSet = new Set(cachedIds);
  console.log(`[LikeService] Loaded ${savedIdsSet.size} saved IDs from cache`);
}

// ── Generic helpers ──────────────────────────────────────────────────────────

const getMap = async (key) => {
  try {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
};

// ── Likes (heart) ────────────────────────────────────────────────────────────

export const getLikedVerses = () => getMap(LIKES_KEY);

export const isLiked = async (verseId) => {
  await ensureLikedInit();
  return likedIdsSet.has(verseId);
};

export const toggleLike = async (verse) => {
  await ensureLikedInit();

  const map = await getMap(LIKES_KEY);
  let newState;

  if (map[verse.id]) {
    delete map[verse.id];
    likedIdsSet.delete(verse.id);
    newState = false;
  } else {
    map[verse.id] = {
      id: verse.id,
      reference: verse.reference,
      content: verse.content,
      savedAt: Date.now(),
    };
    likedIdsSet.add(verse.id);
    newState = true;
  }

  // Update both stores in parallel
  await Promise.all([
    AsyncStorage.setItem(LIKES_KEY, JSON.stringify(map)),
    saveLikedQuoteIds([...likedIdsSet]),
  ]);

  return newState;
};

// ── Saves (bookmark) ─────────────────────────────────────────────────────────

export const getSavedVerses = () => getMap(SAVES_KEY);

export const isSaved = async (verseId) => {
  await ensureSavedInit();
  return savedIdsSet.has(verseId);
};

export const toggleSave = async (verse) => {
  await ensureSavedInit();

  const map = await getMap(SAVES_KEY);
  let newState;

  if (map[verse.id]) {
    delete map[verse.id];
    savedIdsSet.delete(verse.id);
    newState = false;
  } else {
    map[verse.id] = {
      id: verse.id,
      reference: verse.reference,
      content: verse.content,
      savedAt: Date.now(),
    };
    savedIdsSet.add(verse.id);
    newState = true;
  }

  // Update both stores in parallel
  await Promise.all([
    AsyncStorage.setItem(SAVES_KEY, JSON.stringify(map)),
    saveSavedQuoteIds([...savedIdsSet]),
  ]);

  return newState;
};

