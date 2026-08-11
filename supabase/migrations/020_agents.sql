-- ============================================
-- Migration 020: agents als tweede productlijn
-- ============================================
-- Het aanbod is een ladder: eerst het systeem, dan agents erop. Een agent is
-- een module met kind='agent' (zelfde raster, eigen badge) en een maandprijs
-- (setup betaald bij oplevering, daarna abonnement). Agent-activiteit ("wat
-- deed de agent deze week") is de terugkeer-trigger en voedt de weekdrop.
-- Additief; schrijfrechten admin-only conform migratie 019.

-- ─── 1. kind + maandprijs op modules ───
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'system'
    CHECK (kind IN ('system', 'agent')),
  ADD COLUMN IF NOT EXISTS monthly_price_cents int;

-- ─── 2. agent-activiteit ───
CREATE TABLE IF NOT EXISTS public.agent_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_activities_module_date_idx
  ON public.agent_activities (module_id, occurred_on DESC);

ALTER TABLE public.agent_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_view_agent_activities" ON public.agent_activities;
CREATE POLICY "members_view_agent_activities" ON public.agent_activities FOR SELECT
  USING (user_has_client_access(client_id));

DROP POLICY IF EXISTS "admin_manage_agent_activities" ON public.agent_activities;
CREATE POLICY "admin_manage_agent_activities" ON public.agent_activities FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
