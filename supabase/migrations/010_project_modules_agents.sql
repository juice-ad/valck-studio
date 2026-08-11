-- Projectmodules, agents, wekelijkse drops en transparante projectkosten.
-- Klanten lezen alleen data van hun eigen organisatie; alleen admins schrijven.

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'building', 'live', 'on_hold')),
  kind text NOT NULL DEFAULT 'system'
    CHECK (kind IN ('system', 'agent')),
  monthly_price_cents int CHECK (monthly_price_cents IS NULL OR monthly_price_cents >= 0),
  sequence_order int NOT NULL DEFAULT 0,
  preview_url text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS modules_project_order_idx
  ON public.modules (project_id, sequence_order);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_select_by_client" ON public.modules;
DROP POLICY IF EXISTS "admin_manage_modules" ON public.modules;
CREATE POLICY "modules_select_by_client" ON public.modules FOR SELECT
  USING (user_has_client_access(client_id));
CREATE POLICY "admin_manage_modules" ON public.modules FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

ALTER TABLE public.preview_feedback
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS preview_feedback_module_idx
  ON public.preview_feedback (module_id);

ALTER TABLE public.project_updates
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'update'
    CHECK (kind IN ('update', 'drop')),
  ADD COLUMN IF NOT EXISTS link text;

CREATE TABLE IF NOT EXISTS public.project_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount_cents int NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  is_overrun boolean NOT NULL DEFAULT false,
  sequence_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_costs_project_order_idx
  ON public.project_costs (project_id, sequence_order);
ALTER TABLE public.project_costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_costs_select" ON public.project_costs;
DROP POLICY IF EXISTS "admin_manage_project_costs" ON public.project_costs;
CREATE POLICY "project_costs_select" ON public.project_costs FOR SELECT
  USING (user_has_client_access(client_id));
CREATE POLICY "admin_manage_project_costs" ON public.project_costs FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE TABLE IF NOT EXISTS public.agent_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_activities_module_date_idx
  ON public.agent_activities (module_id, occurred_on DESC, created_at DESC);
ALTER TABLE public.agent_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_view_agent_activities" ON public.agent_activities;
DROP POLICY IF EXISTS "admin_manage_agent_activities" ON public.agent_activities;
CREATE POLICY "members_view_agent_activities" ON public.agent_activities FOR SELECT
  USING (user_has_client_access(client_id));
CREATE POLICY "admin_manage_agent_activities" ON public.agent_activities FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Tenant-integriteit: voorkom dat een adminrecord per ongeluk aan het verkeerde
-- client_id wordt gekoppeld en daardoor via RLS bij een andere klant verschijnt.
CREATE OR REPLACE FUNCTION public.validate_project_client_scope()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = NEW.project_id AND p.client_id = NEW.client_id
  ) THEN
    RAISE EXCEPTION 'project_id and client_id must belong to the same client';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS modules_validate_client_scope ON public.modules;
CREATE TRIGGER modules_validate_client_scope
  BEFORE INSERT OR UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_client_scope();

DROP TRIGGER IF EXISTS project_costs_validate_client_scope ON public.project_costs;
CREATE TRIGGER project_costs_validate_client_scope
  BEFORE INSERT OR UPDATE ON public.project_costs
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_client_scope();

CREATE OR REPLACE FUNCTION public.validate_agent_activity_client_scope()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.modules m
    WHERE m.id = NEW.module_id AND m.client_id = NEW.client_id AND m.kind = 'agent'
  ) THEN
    RAISE EXCEPTION 'module_id must reference an agent from the same client';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agent_activities_validate_client_scope ON public.agent_activities;
CREATE TRIGGER agent_activities_validate_client_scope
  BEFORE INSERT OR UPDATE ON public.agent_activities
  FOR EACH ROW EXECUTE FUNCTION public.validate_agent_activity_client_scope();
