-- 006_payment_integration.sql
-- Adds Mollie payment + Moneybird invoice fields

-- Extend invoices table with payment tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS mollie_payment_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS mollie_payment_link_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS mollie_payment_link_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS moneybird_invoice_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS moneybird_contact_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]';

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_invoices_mollie_payment_id ON invoices(mollie_payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Extend clients table for Moneybird sync
ALTER TABLE clients ADD COLUMN IF NOT EXISTS moneybird_contact_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS kvk_number TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_email TEXT;
