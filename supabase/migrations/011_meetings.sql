-- 011_meetings.sql
-- Afspraken in het traject: intake, roadmap-cadans, meeloopdag, review-gesprek.
-- Afronden koppelt terug naar het project via een project_update (in de app).

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES discovery_briefs(id) ON DELETE SET NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'roadmap'
    CHECK (type IN ('intake', 'roadmap', 'meeloopdag', 'review')),
  scheduled_at timestamptz NOT NULL,
  duration_min integer DEFAULT 30,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'completed', 'reschedule_requested', 'cancelled')),
  notes text,
  outcome text,
  meet_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_client ON meetings (client_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_meetings_project ON meetings (project_id);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_meetings" ON meetings;
CREATE POLICY "members_view_meetings" ON meetings FOR SELECT
  USING (user_has_client_access(client_id));

-- klant mag een afspraak verzetten (status naar reschedule_requested)
DROP POLICY IF EXISTS "members_update_meetings" ON meetings;
CREATE POLICY "members_update_meetings" ON meetings FOR UPDATE
  USING (user_has_client_access(client_id));

DROP POLICY IF EXISTS "admin_manage_meetings" ON meetings;
CREATE POLICY "admin_manage_meetings" ON meetings FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
