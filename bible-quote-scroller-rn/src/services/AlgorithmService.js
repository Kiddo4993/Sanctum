// ============================================================
// AlgorithmService — Session-based recommendation engine
//
// Tracks user interest per genre during a session and uses
// weighted random selection to serve relevant verses.
// 60% weighted by interest, 40% pure random for discovery.
// ============================================================

import * as Crypto from 'expo-crypto';
import { loadAlgorithmWeights, saveAlgorithmWeights } from './CacheManager';
import { supabase } from './SupabaseClient';

export const VERSE_POOL = {
  wisdom: ['PSA.23.1', 'PRO.3.5', 'PRO.3.6', 'ECC.3.1', 'JOB.23.10'],
  gospels: ['JHN.3.16', 'JHN.14.6', 'MAT.5.9', 'LUK.6.31', 'MRK.12.30'],
  epistles: ['PHP.4.13', 'PHP.4.7', 'ROM.8.28', 'GAL.5.22', 'EPH.2.8'],
  prophecy: ['ISA.40.31', 'ISA.41.10', 'JER.29.11', 'DAN.12.3', 'MIC.6.8'],
};

export const sessionState = {
  id: Crypto.randomUUID(),
  weights: { wisdom: 1, gospels: 1, epistles: 1, prophecy: 1 },
  seen: new Set(),
  scrollCount: 0,
};

// Debounce Supabase weight writes: at most once every 30 seconds per session
const SYNC_DEBOUNCE_MS = 30_000;
let lastSyncTime = 0;

export function recordInteraction(genre) {
  if (sessionState.weights[genre] !== undefined) {
    sessionState.weights[genre] += 1;
    saveAlgorithmWeights(sessionState.weights).catch(console.warn);

    const now = Date.now();
    if (now - lastSyncTime >= SYNC_DEBOUNCE_MS) {
      lastSyncTime = now;
      supabase.auth.getSession().then(({ data }) => {
        const userId = data?.session?.user?.id;
        if (userId) {
          supabase.from('profiles').update({ weights: sessionState.weights }).eq('id', userId)
            .catch(e => console.warn('Silently failed to sync weight to Supabase', e));
        }
      });
    }
  }
}

/**
 * Merge stored profile weights into the current session.
 * Called on app startup to restore user preferences.
 */
export function loadWeights(stored) {
  for (const [genre, weight] of Object.entries(stored)) {
    if (sessionState.weights[genre] !== undefined) {
      sessionState.weights[genre] = weight;
    }
  }
}

/**
 * Initialize session weights from local cache on app startup.
 * Upgrades to Supabase if logged in.
 */
export async function initAlgorithm() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (userId) {
      // Sync from Supabase
      const { data } = await supabase.from('profiles').select('weights').eq('id', userId).single();
      if (data?.weights) {
        loadWeights(data.weights);
      }
    } else {
      // Load local guest cache
      const stored = await loadAlgorithmWeights();
      if (stored) {
        loadWeights(stored);
      }
    }
  } catch (err) {
    console.warn('[AlgorithmService] Failed to load weights:', err);
  }
}

/**
 * Promote session weights to Supabase profile on login.
 */
export const promoteSessionWeights = async (userId) => {
  try {
    const { data } = await supabase.from('profiles').select('weights').eq('id', userId).single();
    const existing = data?.weights || {};
    const session = sessionState.weights;
    const merged = {};
    for (const genre of Object.keys(session)) {
      merged[genre] = (existing[genre] || 0) + session[genre];
    }
    await supabase.from('profiles').update({ weights: merged }).eq('id', userId);
    console.log('[AlgorithmService] Successfully promoted session weights');
  } catch (err) {
    console.warn('[AlgorithmService] Failed to promote weights', err);
  }
};

/**
 * Export current session weights (for persisting preferences).
 */
export function getWeights() {
  return { ...sessionState.weights };
}

function pickGenre() {
  if (Math.random() < 0.4) {
    const genres = Object.keys(VERSE_POOL);
    return genres[Math.floor(Math.random() * genres.length)];
  }

  const total = Object.values(sessionState.weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [genre, weight] of Object.entries(sessionState.weights)) {
    rand -= weight;
    if (rand <= 0) return genre;
  }
  return 'gospels';
}

export function getNextVerseId() {
  const genre = pickGenre();
  let pool = VERSE_POOL[genre].filter((id) => !sessionState.seen.has(id));

  if (pool.length === 0) {
    for (const id of VERSE_POOL[genre]) {
      sessionState.seen.delete(id);
    }
    pool = [...VERSE_POOL[genre]];
  }

  const verseId = pool[Math.floor(Math.random() * pool.length)];
  sessionState.seen.add(verseId);
  sessionState.scrollCount++;

  return { verseId, genre };
}
