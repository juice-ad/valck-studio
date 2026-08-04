-- 008_library_items.sql
-- Bibliotheek van eerder gebouwde componenten, modules en agents.
-- Commerciële helft van de Valck-registry: gevoed door de oogst na elk project,
-- getoond (met indicatieprijzen) in de intake en bij build requests.

CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('component', 'module', 'agent')),
  price_cents_indicative INTEGER, -- excl. btw, in centen; NULL = geen losse prijs
  price_note TEXT,                -- bijv. '±' of 'vanaf'
  built_for TEXT[] NOT NULL DEFAULT '{}',
  stack TEXT,                     -- bijv. 'react18-tw3' of 'react19-tw4'
  source_ref TEXT,                -- repo + pad in de valck-registry
  thumbnail_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_sold INTEGER NOT NULL DEFAULT 0,
  last_sold_price_cents INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items(category);
CREATE INDEX IF NOT EXISTS idx_library_items_active_sort ON library_items(is_active, sort_order);

ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- Bewust leesbaar voor alle ingelogde gebruikers: dit is klant-zichtbare
-- etalage-content (intake-stap toont deze items met prijzen).
DROP POLICY IF EXISTS "authenticated_read_library" ON library_items;
CREATE POLICY "authenticated_read_library" ON library_items FOR SELECT
  TO authenticated
  USING (true);

-- Schrijven alleen door admin.
DROP POLICY IF EXISTS "admin_manage_library" ON library_items;
CREATE POLICY "admin_manage_library" ON library_items FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');
