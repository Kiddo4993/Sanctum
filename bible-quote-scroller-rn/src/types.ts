// ============================================================
// Sanctum — Shared Type Definitions
// ============================================================

/** Row shape from the Supabase `quotes` table. */
export interface Quote {
  id: string;
  bible_api_id: string;
  book: string;
  testament: string;
  chapter: number;
  verse: number;
  text: string;
  category: string | null;
  like_count: number;
}

/** Row shape from the Supabase `quote_meanings` table. */
export interface QuoteMeaning {
  id: string;
  quote_id: string;
  meaning_text: string;
  suggested_by: string | null;
  is_active: boolean;
  created_at: string;
}

/** Row shape from the Supabase `users` table. */
export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  narrator_voice: string;
  theme: string;
  qr_code_token: string;
}

/** Row shape from the Supabase `likes` table. */
export interface Like {
  id: string;
  user_id: string;
  quote_id: string;
  created_at: string;
}

/** Row shape from the Supabase `saves` table. */
export interface Save {
  id: string;
  user_id: string;
  quote_id: string;
  created_at: string;
}

/** A verse as returned by the Bible API or our internal service. */
export interface VerseResponse {
  id: string;
  reference: string;
  content: string;
}

/** Metadata for a cached audio file. */
export interface CachedAudio {
  quoteId: string;
  publicUrl: string;
  localPath?: string;
}

/** Local like state stored in AsyncStorage for optimistic updates. */
export interface LikeState {
  likedIds: string[];
  pendingSync: PendingSyncAction[];
  lastSyncedAt: string | null;
}

/** An action that hasn't been synced to Supabase yet. */
export interface PendingSyncAction {
  type: 'like' | 'unlike';
  quoteId: string;
  timestamp: string;
}

/** Cache entry wrapper with TTL metadata. */
export interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string | null;
}
