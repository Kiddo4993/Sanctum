// ============================================================
// MeaningService — AI-generated verse meaning caching
//
// Caching strategy:
//   1. Check Supabase `quote_meanings` table for an active meaning
//   2. If found → return from DB (free, instant)
//   3. If not → call OpenAI GPT-4o mini to generate a meaning
//   4. Save to `quote_meanings` table, return
//
// Meanings never expire — a verse's meaning doesn't change.
// ============================================================

import axios from 'axios';
import { supabase } from '../config/supabaseClient';
import type { QuoteMeaning } from '../types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Get (or generate) a meaning for a quote.
 *
 * @param quoteId  The Supabase `quotes.id` UUID
 * @param verseText  The plain text of the verse (used as context for OpenAI)
 * @param verseReference  e.g. "John 3:16" (for a better prompt)
 */
export async function getMeaning(
  quoteId: string,
  verseText: string,
  verseReference: string
): Promise<string> {
  // ── Step 1: Check Supabase for cached meaning ─────────────
  try {
    const { data: cached, error } = await supabase
      .from('quote_meanings')
      .select('meaning_text')
      .eq('quote_id', quoteId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached && !error) {
      console.log(`[MeaningService] Cache HIT for quote ${quoteId}`);
      return cached.meaning_text;
    }
  } catch {
    console.log(`[MeaningService] Supabase unavailable, generating meaning for "${verseReference}"`);
  }

  // ── Step 2: Generate via OpenAI ───────────────────────────
  console.log(`[MeaningService] Cache MISS — generating meaning for "${verseReference}"`);
  const meaningText = await generateMeaning(verseText, verseReference);

  // ── Step 3: Save to Supabase (fire and forget) ────────────
  supabase
    .from('quote_meanings')
    .insert({
      quote_id: quoteId,
      meaning_text: meaningText,
      suggested_by: null, // AI-generated, not user-suggested
      is_active: true,
    })
    .then(({ error }) => {
      if (error) console.warn('[MeaningService] Failed to cache meaning:', error.message);
      else console.log(`[MeaningService] Cached meaning for quote ${quoteId}`);
    });

  return meaningText;
}

/**
 * Call OpenAI GPT-4o mini to generate a calm, thoughtful explanation.
 * Returns a placeholder if no API key is configured.
 */
async function generateMeaning(verseText: string, verseReference: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    return `This verse from ${verseReference} speaks to the heart of faith. ` +
      `Set EXPO_PUBLIC_OPENAI_API_KEY in .env to generate AI-powered meanings.`;
  }

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a gentle, contemplative Bible scholar. ' +
              'Explain the meaning of the given verse in 3-4 calm, thoughtful sentences. ' +
              'Keep the tone warm, reverent, and accessible. ' +
              'Do not use overly academic language.',
          },
          {
            role: 'user',
            content: `Please explain the meaning of ${verseReference}: "${verseText}"`,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const choice = response.data?.choices?.[0]?.message?.content;
    return choice?.trim() ?? 'Unable to generate meaning at this time.';
  } catch (error: any) {
    console.warn('[MeaningService] OpenAI API failed:', error.message);
    return `A profound verse from ${verseReference}. Unable to generate AI meaning right now.`;
  }
}

/**
 * Get all meanings for a quote (including user-suggested ones).
 */
export async function getAllMeanings(quoteId: string): Promise<QuoteMeaning[]> {
  const { data, error } = await supabase
    .from('quote_meanings')
    .select('*')
    .eq('quote_id', quoteId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[MeaningService] Failed to fetch meanings:', error.message);
    return [];
  }

  return (data ?? []) as QuoteMeaning[];
}
