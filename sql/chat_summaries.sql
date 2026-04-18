-- Per-family chat summary cache
CREATE TABLE chat_summaries (
  family_id UUID PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  summarized_count INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view their chat summary"
  ON chat_summaries FOR SELECT TO authenticated
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "Family members can upsert their chat summary"
  ON chat_summaries FOR ALL TO authenticated
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
