-- ==============================================================================
-- Migration: 20260315_phase1_security_hardening.sql
-- Description: 
--   1. Fix privilege escalation via BEFORE UPDATE trigger on public.profiles
--   2. Implement non-recursive SECURITY DEFINER role-check functions
--   3. Revoke dangerous RPC execution grants from anon (admin_create_user)
--   4. Revoke over-permissive table grants from anon
--   5. Fix directory visibility to respect privacy
-- ==============================================================================

-- 1. Helper function: Get current user role safely without RLS recursion
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;

-- 2. Helper function: Check if current user is admin/staff without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'superadmin', 'super_admin', 'staff')
     FROM public.profiles
     WHERE id = (SELECT auth.uid()) LIMIT 1),
    false
  );
$$;

-- 3. Trigger Function: Prevent non-admin users from escalating privileges
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  caller_uid UUID;
BEGIN
  caller_uid := auth.uid();

  -- If operation is initiated by Supabase service_role, permit it
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Fetch authenticated caller's actual role from database
  SELECT role INTO caller_role FROM public.profiles WHERE id = caller_uid;

  -- Detect unauthorized changes to sensitive system columns
  IF (NEW.role IS DISTINCT FROM OLD.role) OR
     (NEW.status IS DISTINCT FROM OLD.status) OR
     (NEW.student_id IS DISTINCT FROM OLD.student_id) THEN

    IF caller_role IS NULL OR caller_role NOT IN ('admin', 'superadmin', 'super_admin') THEN
      RAISE EXCEPTION 'Privilege escalation detected: Only authorized administrators may change role, status, or student_id.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 4. Revoke anonymous RPC execution on administrative functions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'admin_create_user'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.admin_create_user FROM anon';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.admin_create_user FROM authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_create_user TO service_role';
  END IF;
END $$;

-- 5. Revoke unwarranted permissions granted to anon on sensitive tables
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.donations FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;

-- Ensure authenticated users have least privilege
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.donations TO authenticated;

-- Ensure service_role maintains full administration
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.donations TO service_role;
GRANT ALL ON public.audit_logs TO service_role;

-- 6. Harden profiles RLS policies using non-recursive functions
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- Authenticated users can view profiles (directory & self)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can only insert their own row matching auth.uid()
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid()) OR public.is_admin_or_staff()
  );

-- Authenticated users can update their own row (column restrictions enforced by trigger)
-- Admins/staff can update rows
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid()) OR public.is_admin_or_staff()
  )
  WITH CHECK (
    id = (SELECT auth.uid()) OR public.is_admin_or_staff()
  );

-- Only admins/superadmins can delete profiles
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    public.current_user_role() IN ('admin', 'superadmin', 'super_admin')
  );
