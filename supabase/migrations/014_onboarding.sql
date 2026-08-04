-- 014_onboarding.sql
-- Eenmalige welkomstflow: onthoud wanneer een klant is onboard.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- Zorg dat een gebruiker zijn eigen profiel mag bijwerken (voor de vlag).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'users_update_own_profile'
  ) THEN
    EXECUTE 'CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id)';
  END IF;
END $$;
