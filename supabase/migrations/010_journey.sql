-- 010_journey.sql
-- De ruggengraat van de "Jouw traject"-ervaring: intake -> project,
-- wekelijkse workflow-stappen, datums op review-rondes en de feedback-terugkoppellus.

-- ─── 1. Intake -> project koppeling ───
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brief_id uuid REFERENCES discovery_briefs(id) ON DELETE SET NULL;

-- ─── 2. Review-rondes krijgen een datumbereik (weken worden echte tijd) ───
ALTER TABLE review_rounds ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE review_rounds ADD COLUMN IF NOT EXISTS due_date date;

-- review_rounds RLS naar het org-based patroon (was nog auth.uid() = client_id uit 002)
ALTER TABLE review_rounds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Klanten zien eigen reviews" ON review_rounds;
DROP POLICY IF EXISTS "members_view_review_rounds" ON review_rounds;
CREATE POLICY "members_view_review_rounds" ON review_rounds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = review_rounds.project_id AND user_has_client_access(p.client_id)
  ));
DROP POLICY IF EXISTS "members_update_review_rounds" ON review_rounds;
CREATE POLICY "members_update_review_rounds" ON review_rounds FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = review_rounds.project_id AND user_has_client_access(p.client_id)
  ));
DROP POLICY IF EXISTS "admin_manage_review_rounds" ON review_rounds;
CREATE POLICY "admin_manage_review_rounds" ON review_rounds FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- project_updates RLS gelijktrekken (de tijdlijn die de klant leest)
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Klanten zien eigen updates" ON project_updates;
DROP POLICY IF EXISTS "members_view_project_updates" ON project_updates;
CREATE POLICY "members_view_project_updates" ON project_updates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_updates.project_id AND user_has_client_access(p.client_id)
  ));
DROP POLICY IF EXISTS "admin_manage_project_updates" ON project_updates;
CREATE POLICY "admin_manage_project_updates" ON project_updates FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ─── 3. Feedback-terugkoppellus: studio antwoordt zichtbaar op klantfeedback ───
ALTER TABLE preview_feedback ADD COLUMN IF NOT EXISTS admin_response text;
ALTER TABLE preview_feedback ADD COLUMN IF NOT EXISTS responded_at timestamptz;

-- ─── 4. Workflow-stappen: de wekelijkse "we bouwen dit samen"-stappen ───
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'build'
    CHECK (category IN ('intake', 'build', 'integrate', 'train', 'scale')),
  sequence_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  owner text NOT NULL DEFAULT 'studio' CHECK (owner IN ('client', 'studio')),
  due_date date,
  completion_notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_project ON workflow_steps (project_id, sequence_order);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_view_workflow_steps" ON workflow_steps;
CREATE POLICY "members_view_workflow_steps" ON workflow_steps FOR SELECT
  USING (user_has_client_access(client_id));
-- klant mag eigen stappen afvinken (owner = client)
DROP POLICY IF EXISTS "members_update_own_workflow_steps" ON workflow_steps;
CREATE POLICY "members_update_own_workflow_steps" ON workflow_steps FOR UPDATE
  USING (user_has_client_access(client_id) AND owner = 'client');
DROP POLICY IF EXISTS "admin_manage_workflow_steps" ON workflow_steps;
CREATE POLICY "admin_manage_workflow_steps" ON workflow_steps FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
