-- ================================================================
-- DIAGNOSTIC & FIX: Donations Data Not Showing in Collections
-- Date: 2026-02-21
-- Run this in Supabase SQL Editor
-- ================================================================

-- ─── STEP 1: CHECK — Is there data in the donations table? ───────────────────
SELECT 
  COUNT(*) AS total_donations,
  COUNT(*) FILTER (WHERE status = 'verified') AS verified_count,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
  COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0) AS total_verified_amount
FROM public.donations;

-- ─── STEP 2: CHECK — What do the actual rows look like? ─────────────────────
SELECT id, amount, status, campaign_id, guest_name, guest_email, created_at
FROM public.donations
ORDER BY created_at DESC
LIMIT 20;

-- ─── STEP 3: CHECK — Which RLS policies exist on donations? ─────────────────
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'donations'
ORDER BY policyname;

-- ─── STEP 4: FIX — Drop all old conflicting RLS policies and rebuild cleanly ─
-- This is the core fix. Old policies may have been overridden by various migrations.

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

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

-- ─── STEP 5: FIX — Create clean, correct RLS policies ───────────────────────

-- Admins and staff can SEE ALL donations (needed for DonationCollections dashboard)
CREATE POLICY "donations_select"
  ON public.donations FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
    OR
    -- Alumni can see their own donations by profile_id
    profile_id = auth.uid()
    OR
    -- Use auth.email() — does NOT require access to auth.users
    guest_email = auth.email()
    OR
    -- Anyone can see verified donations (for leaderboard / public display)
    status = 'verified'
  );

-- Anyone logged in can INSERT a donation (alumni submitting donation proof)
CREATE POLICY "donations_insert"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins and staff can UPDATE donations (verify/reject)
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

-- Only admins can DELETE donations
CREATE POLICY "donations_delete"
  ON public.donations FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- ─── STEP 6: FIX — Ensure table grants are in place ─────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT SELECT ON public.donations TO anon;

-- ─── STEP 7: FIX — Also fix donation_campaigns RLS ──────────────────────────
ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donation_campaigns_select" ON public.donation_campaigns;
DROP POLICY IF EXISTS "donation_campaigns_insert" ON public.donation_campaigns;
DROP POLICY IF EXISTS "donation_campaigns_update" ON public.donation_campaigns;
DROP POLICY IF EXISTS "donation_campaigns_delete" ON public.donation_campaigns;

CREATE POLICY "donation_campaigns_select"
  ON public.donation_campaigns FOR SELECT
  TO authenticated
  USING (true); -- All logged-in users can see campaigns

CREATE POLICY "donation_campaigns_insert"
  ON public.donation_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "donation_campaigns_update"
  ON public.donation_campaigns FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "donation_campaigns_delete"
  ON public.donation_campaigns FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
      IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.donation_campaigns TO authenticated;

-- ─── STEP 8: FIX — Resync campaign current_amount from verified donations ────
-- This recalculates all campaign totals from scratch in case they were zeroed out.
UPDATE public.donation_campaigns c
SET current_amount = COALESCE((
  SELECT SUM(d.amount)
  FROM public.donations d
  WHERE d.campaign_id = c.id
    AND LOWER(TRIM(d.status)) = 'verified'
), 0);

-- ─── STEP 9: VERIFY — Check the result after fixes ──────────────────────────
SELECT 
  'donations' AS tbl,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE status = 'verified') AS verified
FROM public.donations
UNION ALL
SELECT 
  'donation_campaigns',
  COUNT(*),
  NULL
FROM public.donation_campaigns;

-- ─── DONE ──────────────────────────────────────────────────────────────────
-- If the STEP 1 query showed 0 rows in total_donations,
-- then the data itself was deleted. In that case, you need to
-- re-enter donations manually via the DonationManager page.
-- 
-- If STEP 1 showed rows but they still don't appear in the app,
-- the RLS policies above (STEP 5) are the fix.
