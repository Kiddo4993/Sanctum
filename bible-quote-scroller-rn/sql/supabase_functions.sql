-- ============================================================
-- Sanctum — Supabase Postgres Functions
-- Run these in the Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- increment_like_count
-- Atomically increment the like_count for a given quote.
-- Called by LikeService when a user likes a verse.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_like_count(target_quote_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE quotes
  SET like_count = like_count + 1
  WHERE id = target_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ────────────────────────────────────────────────────────────
-- decrement_like_count
-- Atomically decrement the like_count for a given quote.
-- Floors at 0 to prevent negative counts.
-- Called by LikeService when a user unlikes a verse.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_like_count(target_quote_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE quotes
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = target_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
