// ============================================================
// QuoteService — Verse text caching (Local Only)
//
// Caching strategy:
//   1. Check local AsyncStorage cache via CacheManager
//   2. If found → return from DB (free, fast)
//   3. If not → call scripture.api.bible, cache locally, return
//
// This eliminates repeat API calls for the same verse forever.
// ============================================================

import axios from 'axios';
import { addRecentQuote, loadRecentQuotes } from './CacheManager';

const BIBLE_ID = 'de4e12af7f28f599-01'; // ESV
const BASE = 'https://rest.api.bible/v1';
const API_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY || '';

export const VERSE_POOL = {
  wisdom: ['PSA.23.1', 'PRO.3.5', 'PRO.3.6', 'ECC.3.1', 'JOB.23.10'],
  gospels: ['JHN.3.16', 'JHN.14.6', 'MAT.5.9', 'LUK.6.31', 'MRK.12.30'],
  epistles: ['PHP.4.13', 'PHP.4.7', 'ROM.8.28', 'GAL.5.22', 'EPH.2.8'],
  prophecy: ['ISA.40.31', 'ISA.41.10', 'JER.29.11', 'DAN.12.3', 'MIC.6.8'],
};

function parseVerseId(verseId) {
  const parts = verseId.split('.');
  return {
    book: parts[0] || verseId,
    chapter: parseInt(parts[1] || '0', 10),
    verse: parseInt(parts[2] || '0', 10),
  };
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Fetch a verse with caching.
 */
export async function getVerse(verseId, genre = 'wisdom') {
  // ── Step 1: Check Local cache ──────────────────────────
  try {
    const cachedQuotes = await loadRecentQuotes();
    const cached = cachedQuotes.find(q => q.id === verseId);

    if (cached) {
      console.log(`[QuoteService] Cache HIT for ${verseId}`);
      return {
        id: cached.id,
        reference: cached.reference || `${cached.book} ${cached.chapter}:${cached.verse}`,
        content: cached.content || `<p>${cached.text}</p>`,
        genre: cached.genre || genre,
      };
    }
  } catch (err) {
    console.log(`[QuoteService] Local cache error for ${verseId}`, err);
  }

  // ── Step 2: Fetch from Bible API ──────────────────────────
  console.log(`[QuoteService] Cache MISS for ${verseId} — fetching from API`);
  const verseResponse = await fetchFromBibleApi(verseId);
  verseResponse.genre = genre;

  // ── Step 3: Save to local cache ───────────────────────────
  const { book, chapter, verse } = parseVerseId(verseId);
  const plainText = stripHtml(verseResponse.content);

  const quoteRow = {
    id: verseId,
    book,
    chapter,
    verse,
    text: plainText,
    content: verseResponse.content,
    reference: verseResponse.reference,
    genre,
  };

  addRecentQuote(quoteRow).catch(() => {});

  return verseResponse;
}

async function fetchFromBibleApi(verseId) {
  const getMock = () => ({
    id: verseId,
    reference: verseId.replace(/\./g, ' '),
    content: `<p>This is a mock verse for ${verseId}. Set EXPO_PUBLIC_BIBLE_API_KEY in .env to see real verses.</p>`,
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
    return res.data.data;
  } catch (error) {
    console.warn(`[QuoteService] Bible API failed for ${verseId}:`, error.message);
    return getMock();
  }
}
