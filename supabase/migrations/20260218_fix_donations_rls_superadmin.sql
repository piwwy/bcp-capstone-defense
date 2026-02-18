-- ================================================================
-- FIX: Donations RLS Access for Super Admin
-- Date: 2026-02-18
-- ================================================================
-- This migration ensures that the 'superadmin' role (used in code)
-- has full access to the donations and campaigns tables.
-- ================================================================

-- 1. FIX: donations table policies
DROP POLICY IF EXISTS "donations_select" ON public.donations;
DROP POLICY IF EXISTS "donations_update" ON public.donations;
DROP POLICY IF EXISTS "donations_delete" ON public.donations;

CREATE POLICY "donations_select"
  ON public.donations FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) 
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "donations_update"
  ON public.donations FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) 
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) 
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "donations_delete"
  ON public.donations FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) 
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- 2. FIX: donation_campaigns table policies
DROP POLICY IF EXISTS "donation_campaigns_insert" ON public.donation_campaigns;
DROP POLICY IF EXISTS "donation_campaigns_update" ON public.donation_campaigns;
DROP POLICY IF EXISTS "donation_campaigns_delete" ON public.donation_campaigns;

CREATE POLICY "donation_campaigns_insert"
  ON public.donation_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) 
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "donation_campaigns_update"
  ON public.donation_campaigns FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) 
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) 
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "donation_campaigns_delete"
  ON public.donation_campaigns FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) 
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- 3. Ensure other tables also have proper access (Audit Logs, etc.)
-- These were partially fixed in previous migrations but we ensure consistency here.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donation_campaigns TO authenticated;
