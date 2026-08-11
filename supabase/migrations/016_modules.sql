-- ============================================
-- Migration 016: modules (Project → Modules)
-- ============================================
-- Een project (bv. "CCP Portaal") bundelt meerdere modules die week voor week
-- gebouwd worden. De klant ziet een raster van modules met status; de admin
-- beheert ze volledig. Additief, RLS per klant via user_has_client_access.

-- 1. Tabel
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'building', 'live', 'on_hold')),
  sequence_order int NOT NULL DEFAULT 0,
  preview_url text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS modules_project_order_idx
  ON public.modules (project_id, sequence_order);

-- 2. RLS: klant ziet eigen modules, admin via bypass
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_select_by_client" ON public.modules;
DROP POLICY IF EXISTS "modules_insert_by_client" ON public.modules;
DROP POLICY IF EXISTS "modules_update_by_client" ON public.modules;
DROP POLICY IF EXISTS "modules_delete_by_client" ON public.modules;

CREATE POLICY "modules_select_by_client" ON public.modules FOR SELECT
  USING (user_has_client_access(client_id));

CREATE POLICY "modules_insert_by_client" ON public.modules FOR INSERT
  WITH CHECK (user_has_client_access(client_id));

CREATE POLICY "modules_update_by_client" ON public.modules FOR UPDATE
  USING (user_has_client_access(client_id))
  WITH CHECK (user_has_client_access(client_id));

CREATE POLICY "modules_delete_by_client" ON public.modules FOR DELETE
  USING (user_has_client_access(client_id));

-- 3. Feedback kan aan een module hangen (optioneel; project-breed blijft null)
ALTER TABLE public.preview_feedback
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS preview_feedback_module_idx
  ON public.preview_feedback (module_id);
