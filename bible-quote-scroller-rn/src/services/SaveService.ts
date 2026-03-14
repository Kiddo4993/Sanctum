// ============================================================
// SaveService — Optimistic save/unsave with background sync
//
// Mirrors LikeService pattern:
//   • Instant UI updates via local state + AsyncStorage
//   • Background sync to Supabase (fire-and-forget)
//   • Pending action queue for retry on failure
// ============================================================

import { supabase } from '../config/supabaseClient';
import {
  loadSavedQuoteIds,
  saveSavedQuoteIds,
  getRaw,
  setRaw,
} from './CacheManager';
import type { PendingSyncAction } from '../types';

const PENDING_SAVE_KEY = '@sanctum/pending_save_sync';

let savedIdsSet: Set<string> = new Set();
let initialized = false;

/** Initialise save service on app startup. */
export async function initSaveService(userId: string): Promise<void> {
  const cachedIds = await loadSavedQuoteIds();
  savedIdsSet = new Set(cachedIds);
  initialized = true;

  // Background sync from Supabase
  syncFromSupabase(userId).catch(() => {});
  retryPendingActions(userId).catch(() => {});
}

/** Check if a quote is saved (instant, in-memory). */
export function isSaved(quoteId: string): boolean {
  return savedIdsSet.has(quoteId);
}

/** Get all saved quote IDs. */
export function getSavedIds(): string[] {
  return [...savedIdsSet];
}

/**
 * Toggle save/unsave with optimistic update.
 * @returns New save state (true = saved, false = unsaved)
 */
export async function toggleSave(userId: string, quoteId: string): Promise<boolean> {
  const wasSaved = savedIdsSet.has(quoteId);
  const newState = !wasSaved;

  // Optimistic update
  if (newState) savedIdsSet.add(quoteId);
  else savedIdsSet.delete(quoteId);

  await saveSavedQuoteIds([...savedIdsSet]);

  // Background sync
  syncAction(userId, quoteId, newState).catch(async () => {
    await queuePendingAction({
      type: newState ? 'save' : 'unsave',
      quoteId,
      timestamp: new Date().toISOString(),
    });
  });

  return newState;
}

/** Fetch all saved quotes with full data (for the Saved screen). */
export async function getSavedQuotes(userId: string) {
  const { data, error } = await supabase
    .from('saves')
    .select('quote_id, created_at, quotes(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[SaveService] Failed to fetch saved quotes:', error.message);
    return [];
  }

  return data ?? [];
}

async function syncAction(userId: string, quoteId: string, saved: boolean): Promise<void> {
  if (saved) {
    const { error } = await supabase
      .from('saves')
      .upsert({ user_id: userId, quote_id: quoteId }, { onConflict: 'user_id,quote_id' });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('saves')
      .delete()
      .eq('user_id', userId)
      .eq('quote_id', quoteId);
    if (error) throw error;
  }
}

async function syncFromSupabase(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('saves')
    .select('quote_id')
    .eq('user_id', userId);

  if (error) return;

  const remoteIds = new Set((data ?? []).map((r: { quote_id: string }) => r.quote_id));
  const pending = await loadPendingActions();
  const pendingQuoteIds = new Set(pending.map((a) => a.quoteId));

  for (const id of savedIdsSet) {
    if (!pendingQuoteIds.has(id) && !remoteIds.has(id)) savedIdsSet.delete(id);
  }
  for (const id of remoteIds) {
    if (!pendingQuoteIds.has(id)) savedIdsSet.add(id);
  }

  await saveSavedQuoteIds([...savedIdsSet]);
}

async function loadPendingActions(): Promise<PendingSyncAction[]> {
  return (await getRaw<PendingSyncAction[]>(PENDING_SAVE_KEY)) ?? [];
}

async function queuePendingAction(action: PendingSyncAction): Promise<void> {
  const pending = await loadPendingActions();
  const filtered = pending.filter((a) => a.quoteId !== action.quoteId);
  filtered.push(action);
  await setRaw(PENDING_SAVE_KEY, filtered);
}

async function retryPendingActions(userId: string): Promise<void> {
  const pending = await loadPendingActions();
  if (pending.length === 0) return;

  const remaining: PendingSyncAction[] = [];
  for (const action of pending) {
    try {
      await syncAction(userId, action.quoteId, action.type === 'save');
    } catch {
      remaining.push(action);
    }
  }
  await setRaw(PENDING_SAVE_KEY, remaining);
}
