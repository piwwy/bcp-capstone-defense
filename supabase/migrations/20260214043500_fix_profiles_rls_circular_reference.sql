-- ============================================================
-- Migration: Fix profiles table RLS (circular reference fix)
-- ============================================================
-- Problem: profiles RLS policy queries profiles table itself,
--          causing infinite recursion → 500 Internal Server Error
-- Solution:
--   1. Create SECURITY DEFINER function is_admin() to safely
--      check admin role without triggering RLS on profiles
--   2. Rebuild profiles policies with NO circular subqueries
-- ============================================================

-- ============================================================
-- STEP 1: Drop ALL existing policies on profiles
-- ============================================================
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

-- ============================================================
-- STEP 2: Create SECURITY DEFINER helper function
-- ============================================================
-- This function checks if the current user is admin/super_admin
-- by reading profiles as the DB owner (bypasses RLS),
-- preventing circular reference when used inside profiles policies.
-- ============================================================
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
      AND role IN ('admin', 'super_admin')
  );
$$;

-- ============================================================
-- STEP 3: Ensure RLS is enabled
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create optimized profiles policies
-- ============================================================

-- All authenticated users can read all profiles
-- (needed for: messaging, forums, alumni directory, admin panel)
-- NO subquery on profiles = NO circular reference
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only create their own profile (during registration)
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid())
  );

-- Users update own profile; admins update any profile
-- (admins need this for: verify/reject alumni, change roles)
-- Uses is_admin() SECURITY DEFINER function to avoid circular reference
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

-- Only admins can delete profiles
CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );
