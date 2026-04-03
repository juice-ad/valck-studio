-- ============================================
-- Migration 004: Switch FKs to clients table + org-based RLS
-- ============================================

-- ─── 1. Drop old FK constraints (were pointing to auth.users) ───

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_client_id_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_client_id_fkey;
ALTER TABLE discovery_briefs DROP CONSTRAINT IF EXISTS discovery_briefs_client_id_fkey;
ALTER TABLE preview_feedback DROP CONSTRAINT IF EXISTS preview_feedback_client_id_fkey;

-- ─── 2. Add new FK constraints pointing to clients table ───

ALTER TABLE projects ADD CONSTRAINT projects_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE documents ADD CONSTRAINT documents_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE invoices ADD CONSTRAINT invoices_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE discovery_briefs ADD CONSTRAINT discovery_briefs_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE preview_feedback ADD CONSTRAINT preview_feedback_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- ─── 3. Update RLS policies to use org-based access ───

-- Projects
DROP POLICY IF EXISTS "Klanten zien eigen projecten" ON projects;
CREATE POLICY "members_view_projects" ON projects FOR SELECT
  USING (user_has_client_access(client_id));
CREATE POLICY "admin_manage_projects" ON projects FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Documents
DROP POLICY IF EXISTS "Klanten zien eigen documenten" ON documents;
CREATE POLICY "members_view_documents" ON documents FOR SELECT
  USING (user_has_client_access(client_id));
CREATE POLICY "admin_manage_documents" ON documents FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Invoices
DROP POLICY IF EXISTS "Klanten zien eigen facturen" ON invoices;
CREATE POLICY "members_view_invoices" ON invoices FOR SELECT
  USING (user_has_client_access(client_id));
CREATE POLICY "admin_manage_invoices" ON invoices FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Discovery briefs
DROP POLICY IF EXISTS "Klanten zien eigen briefs" ON discovery_briefs;
DROP POLICY IF EXISTS "Klanten maken eigen briefs" ON discovery_briefs;
DROP POLICY IF EXISTS "Klanten updaten eigen briefs" ON discovery_briefs;
CREATE POLICY "members_view_briefs" ON discovery_briefs FOR SELECT
  USING (user_has_client_access(client_id));
CREATE POLICY "members_create_briefs" ON discovery_briefs FOR INSERT
  WITH CHECK (user_has_client_access(client_id));
CREATE POLICY "members_update_briefs" ON discovery_briefs FOR UPDATE
  USING (user_has_client_access(client_id));

-- Preview feedback
DROP POLICY IF EXISTS "Klanten zien eigen feedback" ON preview_feedback;
DROP POLICY IF EXISTS "Klanten maken eigen feedback" ON preview_feedback;
CREATE POLICY "members_view_feedback" ON preview_feedback FOR SELECT
  USING (user_has_client_access(client_id));
CREATE POLICY "members_create_feedback" ON preview_feedback FOR INSERT
  WITH CHECK (user_has_client_access(client_id));
