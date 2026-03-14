// ============================================================
// Sanctum — Shared Type Definitions
// ============================================================

// ── Database Row Types (match Supabase schema) ──────────────

/** Row from `profiles` table. */
export interface Profile {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  narrator_voice: string;
  theme: string;
  qr_code_token: string;
  weights: Record<string, number>;
  created_at: string;
}

/** Row from `quotes` table. */
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
  created_at?: string;
}

/** Row from `quote_meanings` table. */
export interface QuoteMeaning {
  id: string;
  quote_id: string;
  meaning_text: string;
  suggested_by: string | null;
  is_active: boolean;
  created_at: string;
}

/** Row from `meaning_suggestions` table. */
export interface MeaningSuggestion {
  id: string;
  user_id: string;
  quote_id: string;
  suggested_meaning: string;
  created_at: string;
}

/** Row from `likes` table. */
export interface Like {
  id: string;
  user_id: string;
  quote_id: string;
  created_at: string;
}

/** Row from `saves` table. */
export interface Save {
  id: string;
  user_id: string;
  quote_id: string;
  created_at: string;
}

/** Row from `friendships` table. */
export interface Friendship {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  method: 'qr_code' | 'username' | null;
  created_at: string;
  // Joined fields (populated by queries)
  requester?: Profile;
  receiver?: Profile;
}

// ── API Response Types ──────────────────────────────────────

/** A verse as returned by the Bible API or our QuoteService. */
export interface VerseResponse {
  id: string;
  reference: string;
  content: string;
}

// ── Firestore Types ─────────────────────────────────────────

/** Firestore `group_chats/{chatId}` document. */
export interface GroupChat {
  id: string;
  name: string;
  members: string[];
  created_by: string;
  created_at: Date;
  last_message: string;
}

/** Firestore message document (group or DM). */
export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  quote_id?: string;
  quote_text?: string;
  sent_at: Date;
}

// ── Local Cache Types ───────────────────────────────────────

/** Metadata for a cached audio file. */
export interface CachedAudio {
  quoteId: string;
  publicUrl: string;
  localPath?: string;
}

/** Local like/save state stored in AsyncStorage for optimistic updates. */
export interface PendingSyncAction {
  type: 'like' | 'unlike' | 'save' | 'unsave';
  quoteId: string;
  timestamp: string;
}

/** Cache entry wrapper with metadata. */
export interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string | null;
}

// ── UI Types ────────────────────────────────────────────────

/** A card in the scroll feed. */
export interface FeedCard {
  uniqueId: string;
  id: string;           // quote ID
  bibleApiId: string;   // e.g. 'JHN.3.16'
  reference: string;    // e.g. 'John 3:16'
  content: string;      // HTML content from Bible API
  text: string;         // plain text
  genre: string;        // category from VERSE_POOL
  liked: boolean;
  saved: boolean;
}

/** Session state for the recommendation algorithm. */
export interface SessionState {
  id: string;
  weights: Record<string, number>;
  seen: Set<string>;
  scrollCount: number;
}

/** Auth state managed by AuthService. */
export interface AuthState {
  user: Profile | null;
  isGuest: boolean;
  isLoading: boolean;
}
