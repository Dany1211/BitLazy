-- ============================================================
-- ROOMS — Private/Public chat rooms with join codes
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id     TEXT    NOT NULL UNIQUE,          -- nanoid slug used in URL & realtime
  title       TEXT    NOT NULL DEFAULT 'Untitled Room',
  topic       TEXT    NOT NULL DEFAULT '',
  is_public   BOOLEAN NOT NULL DEFAULT false,
  join_code   TEXT    NOT NULL UNIQUE,           -- 6-char uppercase code
  created_by  TEXT    NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_rooms"   ON rooms FOR SELECT USING (true);
CREATE POLICY "insert_rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "update_rooms" ON rooms FOR UPDATE USING (true);

-- 2. Add room_id to messages_test (nullable so existing rows keep working)
ALTER TABLE messages_test
  ADD COLUMN IF NOT EXISTS room_id TEXT NOT NULL DEFAULT 'default-room';

-- 3. Ensure realtime is enabled (may already be set)
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
