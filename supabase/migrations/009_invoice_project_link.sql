-- 009_invoice_project_link.sql
-- Facturen kunnen aan een project + fase hangen, zodat ze per fase rollen.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS phase_label text;

CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices (project_id);
