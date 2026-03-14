-- ============================================================
-- Sanctum Database Schema & RLS Policies
-- ============================================================

-- ── 1. Tables ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  narrator_voice TEXT DEFAULT 'Rachel',
  theme TEXT DEFAULT 'dark',
  qr_code_token UUID DEFAULT gen_random_uuid() UNIQUE,
  weights JSONB DEFAULT '{"wisdom":1,"gospels":1,"epistles":1,"prophecy":1}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bible_api_id TEXT UNIQUE NOT NULL,
  book TEXT NOT NULL,
  testament TEXT NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  text TEXT NOT NULL,
  category TEXT,
  like_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_meanings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  meaning_text TEXT NOT NULL,
  suggested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meaning_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  suggested_meaning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, quote_id)
);

CREATE TABLE IF NOT EXISTS saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, quote_id)
);

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  method TEXT CHECK (method IN ('qr_code', 'username')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ── 2. Row Level Security (RLS) ─────────────────────────────

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_meanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meaning_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, users can update their own
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Quotes: Anyone can read, only anon (service) or authenticated can insert
CREATE POLICY "Public read quotes" ON quotes FOR SELECT USING (true);
CREATE POLICY "Auth insert quotes" ON quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update quotes" ON quotes FOR UPDATE USING (true);

-- Quote Meanings: Anyone can read, auth can insert
CREATE POLICY "Public read quote_meanings" ON quote_meanings FOR SELECT USING (true);
CREATE POLICY "Auth insert quote_meanings" ON quote_meanings FOR INSERT WITH CHECK (true);

-- Meaning Suggestions: Users manage their own
CREATE POLICY "Users insert suggestions" ON meaning_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own suggestions" ON meaning_suggestions FOR SELECT USING (auth.uid() = user_id);

-- Likes: Users manage their own
CREATE POLICY "Public read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);

-- Saves: Users manage their own
CREATE POLICY "Users manage own saves" ON saves FOR ALL USING (auth.uid() = user_id);

-- Friendships: Users read their own, insert their own
CREATE POLICY "Users read own friendships" ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users insert friendships" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users update received friendships" ON friendships FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = requester_id);
CREATE POLICY "Users delete own friendships" ON friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- ── 3. RPC Functions (Atomic Updates) ───────────────────────

CREATE OR REPLACE FUNCTION increment_like_count(quote_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE quotes SET like_count = like_count + 1 WHERE id = quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_like_count(quote_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE quotes SET like_count = GREATEST(like_count - 1, 0) WHERE id = quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Storage Bucket Setup (Run Manually in UI or via API) 
-- insert into storage.buckets (id, name, public) values ('verse-audio', 'verse-audio', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
