-- Migration: switch chat_messages and chat_summaries from family-scoped to chat-scoped
-- Run AFTER chats.sql

-- 1. chat_messages: clear old data, add chat_id
TRUNCATE chat_messages CASCADE;

-- Drop policies first (they depend on family_id column)
DROP POLICY IF EXISTS "Users can view their family chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their family" ON chat_messages;

ALTER TABLE chat_messages
  DROP COLUMN IF EXISTS family_id,
  ADD COLUMN chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE;

CREATE POLICY "Users can view their chat messages"
  ON chat_messages FOR SELECT TO authenticated
  USING (chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their chat messages"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their chat messages"
  ON chat_messages FOR DELETE TO authenticated
  USING (chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()));

DROP INDEX IF EXISTS idx_chat_messages_family_created;
CREATE INDEX idx_chat_messages_chat_created ON chat_messages(chat_id, created_at);

-- 2. chat_summaries: recreate with chat_id
DROP TABLE IF EXISTS chat_summaries;

CREATE TABLE chat_summaries (
  chat_id UUID PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  summarized_count INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their chat summary"
  ON chat_summaries FOR SELECT TO authenticated
  USING (chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()));

CREATE POLICY "Users can upsert their chat summary"
  ON chat_summaries FOR ALL TO authenticated
  USING (chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()))
  WITH CHECK (chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()));
