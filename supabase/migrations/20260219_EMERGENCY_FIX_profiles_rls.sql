-- ================================================================
-- 🚨 EMERGENCY FIX: Profiles RLS Circular Reference
-- Date: 2026-02-19
-- ================================================================
-- 
-- ROOT CAUSE ANALYSIS:
-- ====================================================================
-- The SQL that was pasted replaced the profiles SELECT policy.
-- 
-- BEFORE (working):
--   CREATE POLICY "profiles_select" ON profiles FOR SELECT
--   TO authenticated USING (true);
--   → Any logged-in user can read profiles (including their OWN)
--   → This is REQUIRED because AuthContext.tsx calls:
--     supabase.from('profiles').select('*').eq('id', userId).single()
--
-- AFTER (broken - what was pasted):
--   CREATE POLICY "Staff and Admin can view profiles" ON profiles FOR SELECT
--   TO authenticated
--   USING (
--     (SELECT role FROM profiles WHERE id = auth.uid())
--     IN ('staff', 'superadmin', 'admin')
--   );
--   → Alumni CANNOT read their own profile → login breaks
--   → The subquery (SELECT role FROM profiles) is ITSELF subject to RLS
--   → This creates an INFINITE CIRCULAR REFERENCE → ALL roles fail
--   → Result: NOBODY can log in because fetchProfile() returns null
--
-- FIX:
--   1. Drop the broken policy
--   2. Restore "profiles_select" with USING (true) 
--   3. Update is_admin() SECURITY DEFINER function to include all admin roles
--   4. Fix donations policies to avoid similar circular issues
-- ================================================================


-- ================================================================
-- STEP 1: Drop ALL existing profiles SELECT policies (nuclear clean)
-- ================================================================
DO $$
DECLARE
  _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', _pol.policyname);
  END LOOP;
END $$;


-- ================================================================
-- STEP 2: Ensure RLS is enabled (it should already be)
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- STEP 3: Recreate SECURITY DEFINER helper (bypasses RLS safely)
-- ================================================================
-- This function is used by OTHER tables' policies (donations, events, etc.)
-- to check if the current user is admin/staff WITHOUT triggering profiles RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin', 'superadmin', 'staff', 'registrar')
  );
$$;


-- ================================================================
-- STEP 4: Restore correct profiles policies
-- ================================================================

-- SELECT: Any authenticated user can read ANY profile
-- This is CRITICAL for:
--   - AuthContext.tsx fetchProfile() (login flow)
--   - Alumni directory
--   - Admin user management
--   - Messaging/forums showing user names
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Users can create their own profile; admins can create for others
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid())
    OR public.is_admin()
  );

-- UPDATE: Users can update own profile; admins can update any profile
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR public.is_admin()
  );

-- DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );


-- ================================================================
-- STEP 5: Fix donations policies (also had circular reference issues)
-- ================================================================
DO $$
DECLARE
  _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'donations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.donations', _pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- SELECT: Admin/staff see all; alumni see own + verified donations (for leaderboard)
CREATE POLICY "donations_select"
  ON public.donations FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR profile_id = (SELECT auth.uid())
    OR guest_email = (SELECT auth.jwt() ->> 'email')
    OR status = 'verified'
  );

-- INSERT: Anyone authenticated can submit a donation
CREATE POLICY "donations_insert"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow anonymous donations (public donation page)
CREATE POLICY "donations_insert_anon"
  ON public.donations FOR INSERT
  TO anon
  WITH CHECK (true);

-- UPDATE: Only admins can update donation status (verify/reject)
CREATE POLICY "donations_update"
  ON public.donations FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only admins can delete donations
CREATE POLICY "donations_delete"
  ON public.donations FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ================================================================
-- STEP 6: Fix donation_campaigns policies
-- ================================================================
DO $$
DECLARE
  _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'donation_campaigns'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.donation_campaigns', _pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone can view campaigns (including anonymous for public donation page)
CREATE POLICY "donation_campaigns_select"
  ON public.donation_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "donation_campaigns_select_anon"
  ON public.donation_campaigns FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "donation_campaigns_insert"
  ON public.donation_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "donation_campaigns_update"
  ON public.donation_campaigns FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "donation_campaigns_delete"
  ON public.donation_campaigns FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ================================================================
-- STEP 7: Ensure GRANTs are in place
-- ================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT SELECT, INSERT ON public.donations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donation_campaigns TO authenticated;
GRANT SELECT ON public.donation_campaigns TO anon;


-- ================================================================
-- STEP 8: Verify the fix
-- ================================================================
-- Run this to confirm the policies are correct:
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'donations', 'donation_campaigns')
ORDER BY tablename, policyname;


-- ================================================================
-- ✅ DONE! After running this:
--   1. All users (alumni, admin, staff, superadmin) can log in
--   2. AuthContext.tsx fetchProfile() will work for ALL roles
--   3. Donations are visible per role (admin sees all, alumni sees own)
--   4. No more circular reference errors
-- ================================================================
