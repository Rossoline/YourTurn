-- Calendar events table
CREATE TABLE calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) NOT NULL,
  participant_id UUID REFERENCES participants(id),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can manage events"
  ON calendar_events FOR ALL TO authenticated
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE INDEX idx_calendar_events_family_date ON calendar_events(family_id, date);
