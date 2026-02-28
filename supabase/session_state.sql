-- ============================================================
-- session_state table — ONE JSON object per room.
-- Replaces full conversation history for AI context.
-- ============================================================
CREATE TABLE IF NOT EXISTS session_state (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id       TEXT NOT NULL UNIQUE,
  topic         TEXT DEFAULT 'Untitled Discussion',
  summary       TEXT DEFAULT '',
  graph         JSONB DEFAULT '{"claims":0,"evidence":0,"counterarguments":0,"questions":0,"synthesis":0}',
  scores        JSONB DEFAULT '{"depth_avg":0,"logic_issues":0,"score_history":[]}',
  participation JSONB DEFAULT '{}',
  message_count INTEGER DEFAULT 0,
  last_messages JSONB DEFAULT '[]',   -- rolling 8-message window only
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE session_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_session_state"   ON session_state FOR SELECT USING (true);
CREATE POLICY "insert_session_state" ON session_state FOR INSERT WITH CHECK (true);
CREATE POLICY "update_session_state" ON session_state FOR UPDATE USING (true);

-- Auto-update the updated_at timestamp on every write
CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_state_updated_at
  BEFORE UPDATE ON session_state
  FOR EACH ROW
  EXECUTE FUNCTION update_session_updated_at();
