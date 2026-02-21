-- ================================================================
-- FIX: "permission denied for table users"
-- Date: 2026-02-21
-- ================================================================
-- The previous policy used:
--   guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
-- This fails because 'authenticated' role cannot read auth.users.
-- Fix: Use auth.email() which is Supabase's built-in helper function
-- that returns the current user's email safely without needing
-- direct access to auth.users.
-- ================================================================

-- ─── STEP 1: Drop ALL existing donations policies ────────────────────────────
DROP POLICY IF EXISTS "donations_select" ON public.donations;
DROP POLICY IF EXISTS "donations_insert" ON public.donations;
DROP POLICY IF EXISTS "donations_update" ON public.donations;
DROP POLICY IF EXISTS "donations_delete" ON public.donations;
DROP POLICY IF EXISTS "admin_read_all_donations" ON public.donations;
DROP POLICY IF EXISTS "alumni_read_own_donations" ON public.donations;
DROP POLICY IF EXISTS "public_read_verified_donations" ON public.donations;
DROP POLICY IF EXISTS "Allow read for admins" ON public.donations;
DROP POLICY IF EXISTS "Allow alumni to read own donations" ON public.donations;
DROP POLICY IF EXISTS "Allow verified donations for leaderboard" ON public.donations;

-- ─── STEP 2: Recreate clean policy using auth.email() ────────────────────────
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "donations_select"
  ON public.donations FOR SELECT
  TO authenticated
  USING (
    -- Admins and staff can read ALL donations
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
    OR
    -- Alumni can see their own donations by profile_id
    profile_id = auth.uid()
    OR
    -- Alumni can see their own guest donations by email (using auth.email() — NO auth.users access needed)
    guest_email = auth.email()
    OR
    -- Anyone logged in can see verified donations (for leaderboard)
    status = 'verified'
  );

CREATE POLICY "donations_insert"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "donations_update"
  ON public.donations FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "donations_delete"
  ON public.donations FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- ─── STEP 3: Ensure grants are correct ───────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT SELECT ON public.donations TO anon;

-- ─── STEP 4: Verify the fix ──────────────────────────────────────────────────
SELECT
  COUNT(*) AS total_donations,
  COUNT(*) FILTER (WHERE LOWER(TRIM(status)) = 'verified') AS verified_count,
  COALESCE(SUM(amount) FILTER (WHERE LOWER(TRIM(status)) = 'verified'), 0) AS total_verified_amount
FROM public.donations;
