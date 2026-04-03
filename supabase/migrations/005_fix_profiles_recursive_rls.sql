-- ============================================
-- Migration 005: Fix infinite recursion in profiles RLS policy
-- ============================================
-- The "admin_select_all_profiles" policy from migration 002 caused infinite
-- recursion by doing a subquery on the profiles table from within a profiles
-- policy. We fix this by using the SECURITY DEFINER function get_user_role()
-- from migration 003, which bypasses RLS and avoids the recursion.

-- 1. Drop the recursive policy
DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.profiles;

-- 2. Recreate using SECURITY DEFINER function (no recursion)
CREATE POLICY "admin_select_all_profiles" ON public.profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- 3. Ensure basic 'users see own profile' policy exists
-- (might already exist from initial schema, safe to create if not)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'users_view_own_profile'
  ) THEN
    EXECUTE 'CREATE POLICY "users_view_own_profile" ON public.profiles FOR SELECT USING (auth.uid() = id)';
  END IF;
END
$$;
