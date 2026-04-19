-- Per-user chat sessions
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Новий чат',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chats"
  ON chats FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own chats"
  ON chats FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chats"
  ON chats FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chats"
  ON chats FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_chats_user_family ON chats(user_id, family_id, created_at DESC);
