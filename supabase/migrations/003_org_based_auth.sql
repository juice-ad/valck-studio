-- ============================================
-- Migration 003: Organization-Based Auth (juice-events pattern)
-- ============================================

-- ─── 1. Clients tabel (organisaties) ───

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text NOT NULL,
  email text NOT NULL,
  phone text,
  logo_url text,
  website_url text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_clients_company_name ON public.clients (company_name);
CREATE INDEX idx_clients_email ON public.clients (email);


-- ─── 2. Extend profiles met role en linked_client_id ───

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'client'
  CHECK (role IN ('admin', 'client'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linked_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_client ON public.profiles (linked_client_id);

-- Sync is_admin met role (bestaande admin users)
UPDATE public.profiles SET role = 'admin' WHERE is_admin = true;


-- ─── 3. User-Client Memberships (junction tabel) ───

CREATE TABLE IF NOT EXISTS public.user_client_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, client_id)
);

ALTER TABLE public.user_client_memberships ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ucm_user_client ON public.user_client_memberships (user_id, client_id);


-- ─── 4. Invites tabel ───

CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_token ON public.invites (token);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;


-- ─── 5. Helper function: user_has_client_access ───

CREATE OR REPLACE FUNCTION public.user_has_client_access(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_client_memberships
    WHERE user_id = auth.uid() AND client_id = p_client_id
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Helper function: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = p_user_id;
$$;


-- ─── 6. RPC: verify_invite ───

CREATE OR REPLACE FUNCTION public.verify_invite(input_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record invites%rowtype;
BEGIN
  SELECT * INTO invite_record FROM invites WHERE token = input_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'code', 'invalid');
  END IF;

  IF invite_record.used THEN
    RETURN json_build_object('success', false, 'code', 'used');
  END IF;

  IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'code', 'expired');
  END IF;

  RETURN json_build_object(
    'success', true,
    'client_id', invite_record.client_id
  );
END;
$$;


-- ─── 7. RPC: burn_invite ───

CREATE OR REPLACE FUNCTION public.burn_invite(input_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record invites%rowtype;
BEGIN
  SELECT * INTO invite_record FROM invites WHERE token = input_token FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false);
  END IF;

  IF invite_record.used THEN
    RETURN json_build_object('success', false);
  END IF;

  UPDATE invites SET used = true WHERE id = invite_record.id;
  RETURN json_build_object('success', true, 'client_id', invite_record.client_id);
END;
$$;


-- ─── 8. RLS Policies ───

-- Clients tabel: admins full access, members view own
CREATE POLICY "admin_full_access_clients" ON public.clients FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "members_view_own_client" ON public.clients FOR SELECT
  USING (user_has_client_access(id));

-- User-client memberships: users see own, admins see all
CREATE POLICY "users_see_own_memberships" ON public.user_client_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admin_manage_memberships" ON public.user_client_memberships FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Invites: admins manage, anyone can verify (via RPC)
CREATE POLICY "admin_manage_invites" ON public.invites FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Update projects RLS to use client_access
-- (existing policies stay for backward compat, new ones add client scoping)

-- Update discovery_briefs: clients see own org's briefs
-- (existing policies use client_id = auth.uid() which maps to the user, not the org)
-- We keep those AND add membership-based access for when we transition

-- Profiles: users can read own, admins read all (extend existing)
-- (admin policy already exists from migration 002)


-- ─── 9. Update handle_new_user trigger to include role ───

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, company, email, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'company',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  );
  RETURN new;
END;
$$;
