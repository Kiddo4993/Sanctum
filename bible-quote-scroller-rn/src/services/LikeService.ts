// ============================================================
// LikeService — Optimistic likes with background sync
//
// Caching strategy:
//   • Instant UI updates via local state + AsyncStorage
//   • Background sync to Supabase (fire-and-forget)
//   • On failure → queue pending actions for retry
//   • On app open → load from AsyncStorage, then reconcile
//     with Supabase in the background
//
// Uses Postgres RPC functions for atomic like_count updates:
//   • increment_like_count(target_quote_id)
//   • decrement_like_count(target_quote_id)
// ============================================================

import { supabase } from '../config/supabaseClient';
import {
  loadLikedQuoteIds,
  saveLikedQuoteIds,
  getRaw,
  setRaw,
} from './CacheManager';
import type { PendingSyncAction } from '../types';

const PENDING_SYNC_KEY = '@sanctum/pending_like_sync';

// ── In-memory state (mirrors AsyncStorage for instant access) ──
let likedIdsSet: Set<string> = new Set();
let initialized = false;

/**
 * Initialise the like service on app startup.
 * Loads from AsyncStorage immediately, then syncs from Supabase.
 */
export async function initLikeService(userId: string): Promise<void> {
  // Load cached liked IDs from AsyncStorage (instant)
  const cachedIds = await loadLikedQuoteIds();
  likedIdsSet = new Set(cachedIds);
  initialized = true;

  console.log(`[LikeService] Loaded ${likedIdsSet.size} liked quotes from cache`);

  // Sync from Supabase in background
  syncFromSupabase(userId).catch((err) =>
    console.warn('[LikeService] Background sync failed:', err)
  );

  // Retry any pending actions from previous sessions
  retryPendingActions(userId).catch((err) =>
    console.warn('[LikeService] Pending retry failed:', err)
  );
}

/**
 * Check if a quote is liked (instant, from in-memory cache).
 */
export function isLiked(quoteId: string): boolean {
  return likedIdsSet.has(quoteId);
}

/**
 * Get all liked quote IDs (instant, from in-memory cache).
 */
export function getLikedIds(): string[] {
  return [...likedIdsSet];
}

/** Fetch all liked quotes with full data (for the Liked screen). */
export async function getLikedQuotes(userId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('quote_id, created_at, quotes(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[LikeService] Failed to fetch liked quotes:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Toggle like/unlike with optimistic update.
 *
 * 1. Immediately update in-memory set + AsyncStorage
 * 2. Fire-and-forget Supabase insert/delete + RPC count update
 * 3. On failure → queue for retry
 *
 * @returns The new like state (true = liked, false = unliked)
 */
export async function toggleLike(userId: string, quoteId: string): Promise<boolean> {
  const wasLiked = likedIdsSet.has(quoteId);
  const newLikedState = !wasLiked;

  // ── Optimistic update (instant) ───────────────────────────
  if (newLikedState) {
    likedIdsSet.add(quoteId);
  } else {
    likedIdsSet.delete(quoteId);
  }

  // Persist to AsyncStorage (fast, ~1ms)
  await saveLikedQuoteIds([...likedIdsSet]);

  // ── Background sync to Supabase ───────────────────────────
  syncAction(userId, quoteId, newLikedState).catch(async () => {
    // On failure, rollback and queue for retry
    console.warn(`[LikeService] Sync failed for ${quoteId}, queuing for retry`);

    await queuePendingAction({
      type: newLikedState ? 'like' : 'unlike',
      quoteId,
      timestamp: new Date().toISOString(),
    });
  });

  return newLikedState;
}

/**
 * Sync a single like/unlike action to Supabase.
 */
async function syncAction(userId: string, quoteId: string, liked: boolean): Promise<void> {
  if (liked) {
    // Insert like row
    const { error: insertError } = await supabase
      .from('likes')
      .upsert({ user_id: userId, quote_id: quoteId }, { onConflict: 'user_id,quote_id' });

    if (insertError) throw insertError;

    // Atomically increment like count via Postgres function
    const { error: rpcError } = await supabase.rpc('increment_like_count', {
      target_quote_id: quoteId,
    });

    if (rpcError) console.warn('[LikeService] RPC increment failed:', rpcError.message);
  } else {
    // Delete like row
    const { error: deleteError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('quote_id', quoteId);

    if (deleteError) throw deleteError;

    // Atomically decrement like count
    const { error: rpcError } = await supabase.rpc('decrement_like_count', {
      target_quote_id: quoteId,
    });

    if (rpcError) console.warn('[LikeService] RPC decrement failed:', rpcError.message);
  }
}

/**
 * Fetch the authoritative liked IDs from Supabase and reconcile with local state.
 */
async function syncFromSupabase(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('likes')
    .select('quote_id')
    .eq('user_id', userId);

  if (error) {
    console.warn('[LikeService] Failed to sync from Supabase:', error.message);
    return;
  }

  const remoteIds = new Set((data ?? []).map((r: { quote_id: string }) => r.quote_id));

  // Merge: keep local additions (pending sync), adopt remote state for everything else
  const pending = await loadPendingActions();
  const pendingQuoteIds = new Set(pending.map((a) => a.quoteId));

  // For non-pending items, trust remote
  for (const id of likedIdsSet) {
    if (!pendingQuoteIds.has(id) && !remoteIds.has(id)) {
      likedIdsSet.delete(id);
    }
  }
  for (const id of remoteIds) {
    if (!pendingQuoteIds.has(id)) {
      likedIdsSet.add(id);
    }
  }

  await saveLikedQuoteIds([...likedIdsSet]);
  console.log(`[LikeService] Synced — ${likedIdsSet.size} liked quotes`);
}

// ── Pending Actions Queue ───────────────────────────────────

async function loadPendingActions(): Promise<PendingSyncAction[]> {
  return (await getRaw<PendingSyncAction[]>(PENDING_SYNC_KEY)) ?? [];
}

async function queuePendingAction(action: PendingSyncAction): Promise<void> {
  const pending = await loadPendingActions();
  // Remove any existing action for the same quote (latest wins)
  const filtered = pending.filter((a) => a.quoteId !== action.quoteId);
  filtered.push(action);
  await setRaw(PENDING_SYNC_KEY, filtered);
}

async function retryPendingActions(userId: string): Promise<void> {
  const pending = await loadPendingActions();
  if (pending.length === 0) return;

  console.log(`[LikeService] Retrying ${pending.length} pending actions`);

  const remaining: PendingSyncAction[] = [];

  for (const action of pending) {
    try {
      await syncAction(userId, action.quoteId, action.type === 'like');
    } catch {
      remaining.push(action);
    }
  }

  await setRaw(PENDING_SYNC_KEY, remaining);

  if (remaining.length > 0) {
    console.warn(`[LikeService] ${remaining.length} actions still pending`);
  } else {
    console.log('[LikeService] All pending actions synced successfully');
  }
}
