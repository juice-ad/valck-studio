-- ============================================
-- Migration 018: kosten per project
-- ============================================
-- De admin levert de kosten aan in het project zelf (regels + uitloop); de
-- klant ziet dit transparant bij oplevering. Additief, RLS per klant.

CREATE TABLE IF NOT EXISTS public.project_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount_cents int NOT NULL DEFAULT 0,
  is_overrun boolean NOT NULL DEFAULT false,
  sequence_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_costs_project_order_idx
  ON public.project_costs (project_id, sequence_order);

ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_costs_select" ON public.project_costs;
DROP POLICY IF EXISTS "project_costs_insert" ON public.project_costs;
DROP POLICY IF EXISTS "project_costs_update" ON public.project_costs;
DROP POLICY IF EXISTS "project_costs_delete" ON public.project_costs;

CREATE POLICY "project_costs_select" ON public.project_costs FOR SELECT
  USING (user_has_client_access(client_id));
CREATE POLICY "project_costs_insert" ON public.project_costs FOR INSERT
  WITH CHECK (user_has_client_access(client_id));
CREATE POLICY "project_costs_update" ON public.project_costs FOR UPDATE
  USING (user_has_client_access(client_id)) WITH CHECK (user_has_client_access(client_id));
CREATE POLICY "project_costs_delete" ON public.project_costs FOR DELETE
  USING (user_has_client_access(client_id));
