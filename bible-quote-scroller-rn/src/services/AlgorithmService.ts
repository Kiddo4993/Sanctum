// ============================================================
// AlgorithmService — Session-based recommendation engine
//
// Tracks user interest per genre during a session and uses
// weighted random selection to serve relevant verses.
// 60% weighted by interest, 40% pure random for discovery.
// ============================================================

import * as Crypto from 'expo-crypto';
import type { SessionState } from '../types';

export const VERSE_POOL: Record<string, string[]> = {
  wisdom: ['PSA.23.1', 'PRO.3.5', 'PRO.3.6', 'ECC.3.1', 'JOB.23.10'],
  gospels: ['JHN.3.16', 'JHN.14.6', 'MAT.5.9', 'LUK.6.31', 'MRK.12.30'],
  epistles: ['PHP.4.13', 'PHP.4.7', 'ROM.8.28', 'GAL.5.22', 'EPH.2.8'],
  prophecy: ['ISA.40.31', 'ISA.41.10', 'JER.29.11', 'DAN.12.3', 'MIC.6.8'],
};

/** Mutable session state — lives in memory for the current session. */
export const sessionState: SessionState = {
  id: Crypto.randomUUID(),
  weights: { wisdom: 1, gospels: 1, epistles: 1, prophecy: 1 },
  seen: new Set<string>(),
  scrollCount: 0,
};

/**
 * Record a positive interaction with a genre (dwell time, tap, like).
 * Increases the weight for that genre so the algorithm serves more of it.
 */
export function recordInteraction(genre: string): void {
  if (sessionState.weights[genre] !== undefined) {
    sessionState.weights[genre] += 1;
  }
}

/**
 * Merge stored profile weights into the current session.
 * Called when a user logs in to restore their preferences.
 */
export function loadWeights(stored: Record<string, number>): void {
  for (const [genre, weight] of Object.entries(stored)) {
    if (sessionState.weights[genre] !== undefined) {
      sessionState.weights[genre] = weight;
    }
  }
}

/**
 * Export current session weights (for saving to Supabase profile on login).
 */
export function getWeights(): Record<string, number> {
  return { ...sessionState.weights };
}

/** Pick a genre: 40% pure random, 60% weighted by interest. */
function pickGenre(): string {
  if (Math.random() < 0.4) {
    const genres = Object.keys(VERSE_POOL);
    return genres[Math.floor(Math.random() * genres.length)]!;
  }

  const total = Object.values(sessionState.weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [genre, weight] of Object.entries(sessionState.weights)) {
    rand -= weight;
    if (rand <= 0) return genre;
  }
  return 'gospels';
}

/**
 * Select the next verse ID to display.
 * Avoids repeats within the session; resets when all verses in a genre are seen.
 */
export function getNextVerseId(): { verseId: string; genre: string } {
  const genre = pickGenre();
  let pool = VERSE_POOL[genre]!.filter((id) => !sessionState.seen.has(id));

  if (pool.length === 0) {
    // All verses in this genre have been seen — reset the genre
    for (const id of VERSE_POOL[genre]!) {
      sessionState.seen.delete(id);
    }
    pool = [...VERSE_POOL[genre]!];
  }

  const verseId = pool[Math.floor(Math.random() * pool.length)]!;
  sessionState.seen.add(verseId);
  sessionState.scrollCount++;

  return { verseId, genre };
}
