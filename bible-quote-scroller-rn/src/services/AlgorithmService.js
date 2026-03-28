// ============================================================
// AlgorithmService — Session-based recommendation engine
//
// Tracks user interest per genre during a session and uses
// weighted random selection to serve relevant verses.
// 60% weighted by interest, 40% pure random for discovery.
// ============================================================

import * as Crypto from 'expo-crypto';
import { loadAlgorithmWeights, saveAlgorithmWeights } from './CacheManager';

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

export function recordInteraction(genre) {
  if (sessionState.weights[genre] !== undefined) {
    sessionState.weights[genre] += 1;
    saveAlgorithmWeights(sessionState.weights).catch(console.warn);
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
 */
export async function initAlgorithm() {
  try {
    const stored = await loadAlgorithmWeights();
    if (stored) {
      loadWeights(stored);
    }
  } catch (err) {
    console.warn('[AlgorithmService] Failed to load weights:', err);
  }
}

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
