-- ============================================
-- Migration 015: berichten per klant scopen
-- ============================================
-- Tot nu toe had `messages` geen client_id en liet de SELECT-policy
-- (is_from_studio = true) ELKE klant alle studio-antwoorden zien — een
-- cross-client lek. We voegen client_id toe, vullen bestaande rijen bij,
-- en scopen RLS strak per klant (admin houdt bypass via user_has_client_access).

-- 1. Kolom
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 2. Backfill vanuit gekoppeld project
UPDATE public.messages m
SET client_id = p.client_id
FROM public.projects p
WHERE m.project_id = p.id
  AND m.client_id IS NULL;

-- 3. Backfill overige klant-berichten vanuit een eenduidige lidmaatschap
UPDATE public.messages m
SET client_id = ucm.client_id
FROM public.user_client_memberships ucm
WHERE m.client_id IS NULL
  AND m.is_from_studio = false
  AND ucm.user_id = m.sender_id
  AND (SELECT count(*) FROM public.user_client_memberships x WHERE x.user_id = m.sender_id) = 1;

-- 4. Index voor de chatlijst
CREATE INDEX IF NOT EXISTS messages_client_created_idx
  ON public.messages (client_id, created_at);

-- 5. RLS herzien: scope per klant
DROP POLICY IF EXISTS "Klanten zien eigen berichten en studio-berichten" ON public.messages;
DROP POLICY IF EXISTS "Klanten sturen eigen berichten" ON public.messages;

CREATE POLICY "messages_select_by_client" ON public.messages FOR SELECT
  USING (user_has_client_access(client_id));

CREATE POLICY "messages_insert_by_client" ON public.messages FOR INSERT
  WITH CHECK (user_has_client_access(client_id) AND auth.uid() = sender_id);
