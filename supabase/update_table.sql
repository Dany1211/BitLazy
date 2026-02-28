-- Update the messages table to include column_type and positioning
ALTER TABLE messages ADD COLUMN IF NOT EXISTS column_type TEXT DEFAULT 'claim';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS x_pos FLOAT DEFAULT 0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS y_pos FLOAT DEFAULT 0;

-- Refresh the publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- (Ignore "already exists" error above)
