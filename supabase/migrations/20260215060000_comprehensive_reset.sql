-- ============================================================
-- LINKER ALUMNI SYSTEM — COMPREHENSIVE DATABASE RESET
-- ============================================================
-- Run this ENTIRE script in: Supabase Dashboard > SQL Editor
-- Date: 2026-02-15
--
-- What this does:
--   1. Fixes handle_new_user() trigger (safe for admin-created users)
--   2. Ensures profiles table has all required columns
--   3. Updates is_admin() to support 'staff' role
--   4. Updates RLS policies for 'staff' role
--   5. Creates audit_logs table
--   6. Drops old registration-approval tables
-- ============================================================


-- ============================================================
-- SECTION 1: FIX profiles TABLE SCHEMA
-- ============================================================
-- Make sure profiles table has ALL columns our app expects.
-- This is safe: IF NOT EXISTS means it does nothing if already present.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS batch_year TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'alumni';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'master_list';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employment_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dpa_consented_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add role enum constraint (drop existing first to avoid conflict)
-- Note: We use TEXT instead of enum for flexibility
-- Valid roles: admin, staff, alumni, superadmin, registrar
-- Valid statuses: master_list, verified, rejected

-- ============================================================
-- SECTION 2: FIX handle_new_user() TRIGGER
-- ============================================================
-- This trigger fires when a new row is added to auth.users.
-- It creates a matching profile record.
--
-- KEY FIX: ON CONFLICT (id) DO NOTHING
-- → Prevents FK errors when the Edge Function (create-users)
--   already inserted the profile BEFORE this trigger fires.
-- → Also safe for manual user creation via Supabase Dashboard.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    status,
    auth_provider,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'master_list'),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  -- ^ If Edge Function already created the profile, skip silently

  RETURN NEW;
END;
$$;

-- Drop existing trigger (to avoid "already exists" error)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SECTION 3: UPDATE is_admin() FOR STAFF ROLE
-- ============================================================
-- The is_admin() function is used in RLS policies.
-- We now include 'staff', 'superadmin' alongside 'admin', 'super_admin'.
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
      AND role IN ('admin', 'super_admin', 'superadmin', 'staff')
  );
$$;


-- ============================================================
-- SECTION 4: CREATE audit_logs TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DO $$
BEGIN
  DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
  DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Admin + staff can view audit logs
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- All authenticated users can insert audit entries
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;


-- ============================================================
-- SECTION 5: UPDATE PROFILES RLS FOR STAFF ROLE
-- ============================================================
-- Staff should be able to read but NOT delete profiles.
-- The is_admin() function already includes 'staff' now.
-- Profiles policies from migration 20260214043500 remain valid.
-- ============================================================

-- No changes needed — is_admin() update covers it.


-- ============================================================
-- SECTION 6: CLEAN UP REGISTRATION-RELATED TABLES
-- ============================================================
-- Since we are using Admin-Provided Accounts model,
-- there is NO public registration anymore.
--
-- TABLES TO CHECK AND DROP if they exist:
-- ============================================================

-- Drop registration-related tables (IF EXISTS = safe, no error if missing)
DROP TABLE IF EXISTS public.registration_requests CASCADE;
DROP TABLE IF EXISTS public.registration_approvals CASCADE;
DROP TABLE IF EXISTS public.pending_registrations CASCADE;
DROP TABLE IF EXISTS public.alumni_accounts CASCADE;

-- NOTE: The profiles.status column still keeps 'pending_approval' as a
-- possible value for backward compatibility with old data.
-- Admin-created accounts use status='master_list' or status='verified'.


-- ============================================================
-- SECTION 7: GRANT TABLE PERMISSIONS
-- ============================================================
-- Ensures all tables are accessible to authenticated users.
-- ============================================================

DO $$
DECLARE
  _tbl TEXT;
BEGIN
  FOR _tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_prisma%'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', _tbl);
  END LOOP;
END $$;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;


-- ============================================================
-- SECTION 8: VERIFY — Run this to check everything is correct
-- ============================================================

-- Check profiles columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'users';

-- Check audit_logs table exists
SELECT COUNT(*) AS audit_logs_exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'audit_logs';


-- ============================================================
-- DONE! Your database is now aligned with the Admin-Provided
-- Accounts model. You can now:
--
-- 1. Create users via Supabase Dashboard > Authentication > Add user
--    → The trigger will auto-create a profile row
--    → Set role in user_metadata: {"role": "staff"} etc.
--
-- 2. Create users via Master List Upload
--    → Edge Function creates auth user + profile
--    → Trigger's ON CONFLICT DO NOTHING prevents duplicates
--
-- 3. When you create a user manually, go to Table Editor >
--    profiles and SET the role to 'admin', 'staff', or 'alumni'
-- ============================================================
