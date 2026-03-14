// ============================================================
// QuoteService — Verse text caching
//
// Caching strategy:
//   1. Check Supabase `quotes` table by `bible_api_id`
//   2. If found → return from DB (free, fast)
//   3. If not → call scripture.api.bible, save to Supabase, return
//   4. Also cache to local AsyncStorage for offline access
//
// This eliminates repeat API calls for the same verse forever.
// ============================================================

import axios from 'axios';
import { supabase } from '../config/supabaseClient';
import { addRecentQuote } from './CacheManager';
import type { Quote, VerseResponse } from '../types';

const BIBLE_ID = 'de4e12af7f28f599-01'; // ESV
const BASE = 'https://rest.api.bible/v1';
const API_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY ?? '';

// ── Verse pool (same categories from existing algorithm.js) ─
export const VERSE_POOL: Record<string, string[]> = {
  wisdom: ['PSA.23.1', 'PRO.3.5', 'PRO.3.6', 'ECC.3.1', 'JOB.23.10'],
  gospels: ['JHN.3.16', 'JHN.14.6', 'MAT.5.9', 'LUK.6.31', 'MRK.12.30'],
  epistles: ['PHP.4.13', 'PHP.4.7', 'ROM.8.28', 'GAL.5.22', 'EPH.2.8'],
  prophecy: ['ISA.40.31', 'ISA.41.10', 'JER.29.11', 'DAN.12.3', 'MIC.6.8'],
};

/**
 * Parse a Bible API verse ID like "JHN.3.16" into book / chapter / verse.
 */
function parseVerseId(verseId: string): { book: string; chapter: number; verse: number } {
  const parts = verseId.split('.');
  return {
    book: parts[0] ?? verseId,
    chapter: parseInt(parts[1] ?? '0', 10),
    verse: parseInt(parts[2] ?? '0', 10),
  };
}

/**
 * Determine testament from the book abbreviation.
 */
function getTestament(book: string): string {
  const otBooks = new Set([
    'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT',
    '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST',
    'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK',
    'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON', 'MIC', 'NAM', 'HAB',
    'ZEP', 'HAG', 'ZEC', 'MAL',
  ]);
  return otBooks.has(book) ? 'OT' : 'NT';
}

/**
 * Strip HTML tags from Bible API content to get plain text.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Determine category from the verse pool.
 */
function getCategoryForVerse(verseId: string): string | null {
  for (const [category, ids] of Object.entries(VERSE_POOL)) {
    if (ids.includes(verseId)) return category;
  }
  return null;
}

/**
 * Fetch a verse with caching.
 *
 * Flow:
 *   1. Check Supabase → return if cached
 *   2. Fetch from Bible API
 *   3. Save to Supabase (background, fire-and-forget)
 *   4. Save to local AsyncStorage cache
 *   5. Return the verse
 */
export async function getVerse(verseId: string): Promise<VerseResponse> {
  // ── Step 1: Check Supabase cache ──────────────────────────
  try {
    const { data: cached, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('bible_api_id', verseId)
      .single();

    if (cached && !error) {
      console.log(`[QuoteService] Cache HIT for ${verseId}`);

      // Also update local cache
      addRecentQuote(cached as Quote).catch(() => {});

      return {
        id: cached.bible_api_id,
        reference: `${cached.book} ${cached.chapter}:${cached.verse}`,
        content: `<p>${cached.text}</p>`,
      };
    }
  } catch {
    // Supabase unavailable — proceed to API
    console.log(`[QuoteService] Supabase unavailable, trying Bible API for ${verseId}`);
  }

  // ── Step 2: Fetch from Bible API ──────────────────────────
  console.log(`[QuoteService] Cache MISS for ${verseId} — fetching from API`);
  const verseResponse = await fetchFromBibleApi(verseId);

  // ── Step 3: Save to Supabase in background ────────────────
  const { book, chapter, verse } = parseVerseId(verseId);
  const plainText = stripHtml(verseResponse.content);

  const quoteRow: Omit<Quote, 'id'> = {
    bible_api_id: verseId,
    book,
    testament: getTestament(book),
    chapter,
    verse,
    text: plainText,
    category: getCategoryForVerse(verseId),
    like_count: 0,
  };

  // Fire and forget — don't block the UI
  supabase
    .from('quotes')
    .upsert(quoteRow, { onConflict: 'bible_api_id' })
    .then(({ error }) => {
      if (error) console.warn('[QuoteService] Failed to cache verse:', error.message);
      else console.log(`[QuoteService] Cached ${verseId} to Supabase`);
    });

  // ── Step 4: Save to local cache ───────────────────────────
  // We fabricate an id since we don't have the Supabase-generated one yet
  addRecentQuote({ id: verseId, ...quoteRow } as Quote).catch(() => {});

  return verseResponse;
}

/**
 * Raw fetch from scripture.api.bible with mock fallback.
 */
async function fetchFromBibleApi(verseId: string): Promise<VerseResponse> {
  const getMock = (): VerseResponse => ({
    id: verseId,
    reference: verseId.replace(/\./g, ' '),
    content: `<p>This is a mock verse for ${verseId}. ` +
      `Set EXPO_PUBLIC_BIBLE_API_KEY in .env to see real verses.</p>`,
  });

  if (!API_KEY || API_KEY === 'your_bible_api_key') {
    await new Promise((r) => setTimeout(r, 300));
    return getMock();
  }

  try {
    const res = await axios.get(
      `${BASE}/bibles/${BIBLE_ID}/verses/${verseId}`,
      {
        headers: { 'api-key': API_KEY, 'Content-Type': 'text/plain' },
        params: { 'include-verse-numbers': false },
      }
    );
    return res.data.data as VerseResponse;
  } catch (error: any) {
    console.warn(`[QuoteService] Bible API failed for ${verseId}:`, error.message);
    return getMock();
  }
}
