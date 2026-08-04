-- 013_brief_transcripts.sql
-- Transcripts en samenvattingen als geordende context achter de intake
-- (bijv. de CCP-gespreksopnames van 30 juli).

CREATE TABLE IF NOT EXISTS brief_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid NOT NULL REFERENCES discovery_briefs(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'transcript' CHECK (kind IN ('transcript', 'summary')),
  body text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  meeting_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brief_transcripts_brief ON brief_transcripts (brief_id, sort_order);

ALTER TABLE brief_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_transcripts" ON brief_transcripts;
CREATE POLICY "members_view_transcripts" ON brief_transcripts FOR SELECT
  USING (user_has_client_access(client_id));

DROP POLICY IF EXISTS "admin_manage_transcripts" ON brief_transcripts;
CREATE POLICY "admin_manage_transcripts" ON brief_transcripts FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
