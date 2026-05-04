-- ============================================
-- Migration 008: Ongoing Platform — Support, Build Requests,
-- Subscriptions, Platforms, Real-time Chat, Intake Branching
-- ============================================

-- ─── 1. Support Tickets ───

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'normaal'
    CHECK (priority IN ('laag', 'normaal', 'hoog', 'urgent')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_behandeling', 'opgelost', 'gesloten')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tickets_client ON public.tickets (client_id);
CREATE INDEX idx_tickets_status ON public.tickets (status);
CREATE INDEX idx_tickets_priority ON public.tickets (priority);
CREATE INDEX idx_tickets_created_at ON public.tickets (created_at DESC);

-- RLS: clients see own org tickets, admin sees all
CREATE POLICY "clients_view_own_tickets" ON public.tickets FOR SELECT
  USING (user_has_client_access(client_id));

CREATE POLICY "clients_insert_own_tickets" ON public.tickets FOR INSERT
  WITH CHECK (user_has_client_access(client_id));

CREATE POLICY "admin_all_tickets" ON public.tickets FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');


-- ─── 2. Ticket Messages (thread per ticket) ───

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_from_studio boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages (ticket_id, created_at);

-- RLS: access via parent ticket's client_id
CREATE POLICY "clients_view_own_ticket_messages" ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
        AND user_has_client_access(tickets.client_id)
    )
  );

CREATE POLICY "clients_insert_own_ticket_messages" ON public.ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_messages.ticket_id
        AND user_has_client_access(tickets.client_id)
    )
  );

CREATE POLICY "admin_all_ticket_messages" ON public.ticket_messages FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');


-- ─── 3. Build Requests ───

CREATE TABLE IF NOT EXISTS public.build_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  desired_outcome text NOT NULL,
  context text,
  priority text NOT NULL DEFAULT 'normaal'
    CHECK (priority IN ('normaal', 'hoog')),
  status text NOT NULL DEFAULT 'ingediend'
    CHECK (status IN ('ingediend', 'in_scoping', 'offerte', 'akkoord', 'afgewezen', 'in_bouw', 'opgeleverd')),
  scoping_notes text,
  quoted_amount_cents integer,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.build_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_build_requests_client ON public.build_requests (client_id);
CREATE INDEX idx_build_requests_status ON public.build_requests (status);
CREATE INDEX idx_build_requests_created_at ON public.build_requests (created_at DESC);

-- RLS
CREATE POLICY "clients_view_own_build_requests" ON public.build_requests FOR SELECT
  USING (user_has_client_access(client_id));

CREATE POLICY "clients_insert_own_build_requests" ON public.build_requests FOR INSERT
  WITH CHECK (user_has_client_access(client_id));

CREATE POLICY "clients_update_own_build_requests" ON public.build_requests FOR UPDATE
  USING (user_has_client_access(client_id));

CREATE POLICY "admin_all_build_requests" ON public.build_requests FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');


-- ─── 4. Build Request Line Items (structured quoting) ───

CREATE TABLE IF NOT EXISTS public.build_request_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_request_id uuid NOT NULL REFERENCES public.build_requests(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount_cents integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.build_request_line_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_br_line_items_request ON public.build_request_line_items (build_request_id, sort_order);

-- RLS: access via parent build_request's client_id
CREATE POLICY "clients_view_own_br_line_items" ON public.build_request_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.build_requests
      WHERE build_requests.id = build_request_line_items.build_request_id
        AND user_has_client_access(build_requests.client_id)
    )
  );

CREATE POLICY "admin_all_br_line_items" ON public.build_request_line_items FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');


-- ─── 5. Subscription Tiers (admin-managed definitions) ───

CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  features jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can read tiers (public info), only admin can modify
CREATE POLICY "anyone_view_tiers" ON public.subscription_tiers FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_tiers" ON public.subscription_tiers FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');


-- ─── 6. Subscriptions (client-tier assignments) ───

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tier_id uuid NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE RESTRICT,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_subscriptions_client ON public.subscriptions (client_id);
CREATE INDEX idx_subscriptions_active ON public.subscriptions (client_id) WHERE end_date IS NULL;

-- RLS
CREATE POLICY "clients_view_own_subscriptions" ON public.subscriptions FOR SELECT
  USING (user_has_client_access(client_id));

CREATE POLICY "admin_all_subscriptions" ON public.subscriptions FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');


-- ─── 7. Platforms (deployed client platforms) ───

CREATE TABLE IF NOT EXISTS public.platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  live_url text,
  accent_color text DEFAULT '#111111',
  modules jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'development'
    CHECK (status IN ('development', 'staging', 'live', 'maintenance')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_platforms_client ON public.platforms (client_id);
CREATE INDEX idx_platforms_status ON public.platforms (status);

-- RLS
CREATE POLICY "clients_view_own_platforms" ON public.platforms FOR SELECT
  USING (user_has_client_access(client_id));

CREATE POLICY "admin_all_platforms" ON public.platforms FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');


-- ─── 8. Messages — add read tracking columns ───

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Default existing messages to read (avoid "unread" flood on upgrade)
UPDATE public.messages SET is_read = true WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages (is_read) WHERE is_read = false;


-- ─── 9. Discovery Briefs — add branch responses ───

ALTER TABLE public.discovery_briefs ADD COLUMN IF NOT EXISTS branch_responses jsonb DEFAULT '{}';


-- ─── 10. Enable Supabase Realtime on messages ───
-- Note: This must also be enabled via Supabase Dashboard > Database > Replication
-- The ALTER PUBLICATION command adds the table to the realtime publication

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- ─── 11. Updated_at triggers ───

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER build_requests_updated_at
  BEFORE UPDATE ON public.build_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER platforms_updated_at
  BEFORE UPDATE ON public.platforms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─── 12. Seed subscription tiers ───

INSERT INTO public.subscription_tiers (name, description, price_cents, features, sort_order)
VALUES
  ('Basis', 'Hosting, monitoring & support', 14900, '["Hosting & deployment", "Uptime monitoring", "Security updates", "Email support (48h)", "1 support ticket tegelijk"]', 1),
  ('Groei', 'Alles van Basis + prioriteit & kleine builds', 24900, '["Hosting & deployment", "Uptime monitoring", "Security updates", "Prioriteit support (24h)", "3 support tickets tegelijk", "Kleine aanpassingen (2u/maand)", "Maandelijkse analytics report"]', 2),
  ('Premium', 'Alles van Groei + dedicated development', 49900, '["Hosting & deployment", "Uptime monitoring", "Security updates", "Dedicated support (4h)", "Onbeperkt support tickets", "8u development/maand", "Maandelijkse strategie-call", "Prioriteit build requests"]', 3)
ON CONFLICT DO NOTHING;
