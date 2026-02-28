-- ============================================================
-- STEP 1: messages_test (Reasoning Board)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages_test (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  column_type TEXT NOT NULL DEFAULT 'claim',
  x_pos FLOAT DEFAULT 0,
  y_pos FLOAT DEFAULT 0,
  parent_id UUID REFERENCES messages_test(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_messages_test" ON messages_test FOR SELECT USING (true);
CREATE POLICY "insert_messages_test" ON messages_test FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE messages_test;


-- ============================================================
-- STEP 2: whiteboard_objects (Collaborative Whiteboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS whiteboard_objects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  object_id TEXT NOT NULL UNIQUE,      -- client-side generated ID
  room_id TEXT NOT NULL DEFAULT 'default-room',
  author TEXT,
  data JSONB NOT NULL,                 -- the drawing object data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE whiteboard_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_wb" ON whiteboard_objects FOR SELECT USING (true);
CREATE POLICY "insert_wb" ON whiteboard_objects FOR INSERT WITH CHECK (true);
CREATE POLICY "update_wb" ON whiteboard_objects FOR UPDATE USING (true);
CREATE POLICY "delete_wb" ON whiteboard_objects FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE whiteboard_objects;
