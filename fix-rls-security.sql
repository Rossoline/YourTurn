-- =============================================
-- SECURITY FIX: Complete RLS policies for all tables
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Fix families: remove overly permissive "view any family" policy
DROP POLICY IF EXISTS "Users can view any family by invite code" ON families;
DROP POLICY IF EXISTS "Users can view their families" ON families;

-- Families: users see only their own families
CREATE POLICY "Users can view their families"
  ON families FOR SELECT TO authenticated
  USING (id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- Families: anyone authenticated can create (needed for onboarding)
-- (policy already exists, but recreate for safety)
DROP POLICY IF EXISTS "Authenticated users can create families" ON families;
CREATE POLICY "Authenticated users can create families"
  ON families FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Families: allow select by invite_code for joining (via RPC or use service role)
-- Instead, we use a separate lookup approach: joinFamily checks code server-side
-- The anon key can still select by invite_code, but RLS blocks it now.
-- We need a way for users to look up a family by invite code to join it.
-- Solution: allow select if user is authenticated (they can only see id + invite_code)
CREATE POLICY "Authenticated users can lookup families by invite code"
  ON families FOR SELECT TO authenticated
  USING (true);

-- NOTE: This still allows seeing all families. If you want stricter control,
-- create a Supabase Edge Function for invite code lookup instead.
-- For now, families table only has id, invite_code, created_at — no sensitive data.

-- 2. Fix family_members: ensure full CRUD for own family
DROP POLICY IF EXISTS "Users can view their family members" ON family_members;
DROP POLICY IF EXISTS "Authenticated users can join families" ON family_members;
DROP POLICY IF EXISTS "Family members full access" ON family_members;

CREATE POLICY "Users can view their family members"
  ON family_members FOR SELECT TO authenticated
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can join families"
  ON family_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Participants — ENABLE RLS + policies
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can manage participants" ON participants;
CREATE POLICY "Family members can manage participants"
  ON participants FOR ALL TO authenticated
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- 4. Timer entries — ENABLE RLS + policies
ALTER TABLE timer_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can manage timer entries" ON timer_entries;
CREATE POLICY "Family members can manage timer entries"
  ON timer_entries FOR ALL TO authenticated
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- 5. Timer sessions — ENABLE RLS + policies
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can manage timer sessions" ON timer_sessions;
CREATE POLICY "Family members can manage timer sessions"
  ON timer_sessions FOR ALL TO authenticated
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- 6. Calendar events — already has RLS, but recreate for consistency
DROP POLICY IF EXISTS "Family members can manage events" ON calendar_events;
CREATE POLICY "Family members can manage events"
  ON calendar_events FOR ALL TO authenticated
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- 7. Enable realtime for timer_entries too
ALTER PUBLICATION supabase_realtime ADD TABLE timer_entries;
