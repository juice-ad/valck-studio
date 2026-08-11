-- ============================================
-- Migration 019: schrijfrechten alleen voor admin (modules + project_costs)
-- ============================================
-- user_has_client_access() geeft naast de admin óók klant-members toegang.
-- De schrijfpolicies uit 016/018 gebruikten die helper, waardoor klanten via
-- de API hun eigen modules en kostenregels konden aanmaken/aanpassen/wissen.
-- De rolverdeling is: admin schrijft, klant leest & reviewt. Lezen blijft
-- per klant (SELECT-policies ongewijzigd); schrijven wordt admin-only,
-- zelfde patroon als project_updates/workflow_steps in migratie 010.

-- ─── modules ───
DROP POLICY IF EXISTS "modules_insert_by_client" ON public.modules;
DROP POLICY IF EXISTS "modules_update_by_client" ON public.modules;
DROP POLICY IF EXISTS "modules_delete_by_client" ON public.modules;
DROP POLICY IF EXISTS "admin_manage_modules" ON public.modules;
CREATE POLICY "admin_manage_modules" ON public.modules FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ─── project_costs ───
DROP POLICY IF EXISTS "project_costs_insert" ON public.project_costs;
DROP POLICY IF EXISTS "project_costs_update" ON public.project_costs;
DROP POLICY IF EXISTS "project_costs_delete" ON public.project_costs;
DROP POLICY IF EXISTS "admin_manage_project_costs" ON public.project_costs;
CREATE POLICY "admin_manage_project_costs" ON public.project_costs FOR ALL
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
