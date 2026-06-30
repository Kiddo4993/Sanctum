-- Run this in your Supabase SQL Editor to set up V2 tables and RLS

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  username TEXT UNIQUE,
  qr_code TEXT,
  weights JSONB DEFAULT '{}'::jsonb,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE saved_quotes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  verse_id TEXT,
  reference TEXT,
  content TEXT,
  genre TEXT,
  is_liked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT saved_quotes_user_verse_unique UNIQUE (user_id, verse_id)
);

CREATE TABLE friends (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  friend_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT friends_user_friend_unique UNIQUE (user_id, friend_id)
);

-- Turn on Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Set up basic access policies
CREATE POLICY "Public profiles are viewable by everyone."
  ON profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK (
    -- Prevent users from self-escalating to premium; is_premium must only be set via service role
    (is_premium IS NOT DISTINCT FROM (SELECT is_premium FROM profiles WHERE id = auth.uid()))
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Users can only see and add their own saved quotes
CREATE POLICY "Users can manage their own saved_quotes."
  ON saved_quotes FOR ALL
  USING ( auth.uid() = user_id );

-- Users can manage their own friends
CREATE POLICY "Users can manage their own friends."
  ON friends FOR ALL
  USING ( auth.uid() = user_id OR auth.uid() = friend_id );

-- ── Migrations (run these if tables already exist) ─────────────────────────────

-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
-- ALTER TABLE saved_quotes ADD CONSTRAINT IF NOT EXISTS saved_quotes_user_verse_unique UNIQUE (user_id, verse_id);
-- ALTER TABLE friends ADD CONSTRAINT IF NOT EXISTS friends_user_friend_unique UNIQUE (user_id, friend_id);
