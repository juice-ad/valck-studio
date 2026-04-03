-- ============================================
-- Migration 002: Discovery Wizard v2 + Review Rounds + Admin
-- ============================================

-- ─── 0. Admin flag op profiles (moet eerst, wordt gereferenced door policies) ───

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- ─── 1. Extend discovery_briefs with new intake fields ───

-- Sectie 1: Bedrijf (business_name + business_description bestaan al)
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS team_size text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS annual_revenue text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS ambition text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS revenue_model text;

-- Sectie 2: Werkwijze & tools
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS current_tools text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS monthly_tool_costs text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS time_consuming_tasks text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS admin_hours_weekly text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS manual_data_transfers text;

-- Sectie 3: Pijnpunten
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS top_frustrations text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS failure_under_pressure text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS lost_clients_due_to_workflow text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS should_be_automatic text;

-- Sectie 4: Groei
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS growth_blockers text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS breaks_at_2x_clients text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS needs_shared_platform text;

-- Sectie 5: Prioriteiten (budget_range bestaat al)
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS automation_priority text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS desired_timeline text;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS dealbreakers text;

-- Meta
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS questionnaire_version integer DEFAULT 2;
ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS current_step integer DEFAULT 0;


-- ─── 2. Review Rounds tabel ───

CREATE TABLE IF NOT EXISTS public.review_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  week_number integer NOT NULL,
  title text NOT NULL,
  description text,
  deployment_url text NOT NULL,
  focus_areas jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  notified_at timestamptz,
  opened_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.review_rounds ENABLE ROW LEVEL SECURITY;

-- Klanten zien reviews van eigen projecten
CREATE POLICY "select_own_project_reviews" ON public.review_rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = review_rounds.project_id
        AND projects.client_id = auth.uid()
    )
  );

-- Admin kan alles (via is_admin check)
CREATE POLICY "admin_all_reviews" ON public.review_rounds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE INDEX idx_review_rounds_project ON public.review_rounds (project_id);


-- ─── 3. Extend preview_feedback ───

ALTER TABLE public.preview_feedback ADD COLUMN IF NOT EXISTS review_round_id uuid REFERENCES public.review_rounds ON DELETE SET NULL;
ALTER TABLE public.preview_feedback ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.preview_feedback ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('design', 'functionaliteit', 'content', 'technisch', 'algemeen'));
ALTER TABLE public.preview_feedback ADD COLUMN IF NOT EXISTS screenshot_url text;
ALTER TABLE public.preview_feedback ADD COLUMN IF NOT EXISTS status text DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved'));

CREATE INDEX IF NOT EXISTS idx_preview_feedback_round ON public.preview_feedback (review_round_id);


-- ─── 4. Admin RLS policies voor bestaande tabellen ───
CREATE POLICY "admin_select_all_briefs" ON public.discovery_briefs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE POLICY "admin_update_all_briefs" ON public.discovery_briefs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE POLICY "admin_select_all_projects" ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE POLICY "admin_update_all_projects" ON public.projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE POLICY "admin_select_all_feedback" ON public.preview_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

CREATE POLICY "admin_select_all_profiles" ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );
