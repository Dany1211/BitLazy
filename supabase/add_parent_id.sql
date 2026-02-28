-- Add parent_id for connecting nodes in the graph
ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id);

-- Refresh the publication for realtime to include the new column
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
