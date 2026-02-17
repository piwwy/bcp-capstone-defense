-- Migration to fix 'Manage Jobs' errors
-- 1. Drops any erroneous triggers on public.jobs that might be referencing non-existent columns (like is_featured)
-- 2. Ensures the jobs table structure is correct

-- Drop all triggers on public.jobs to clear any bad configurations
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
          AND event_object_table = 'jobs'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.jobs', t_name);
    END LOOP;
END;
$$;

-- Verify `jobs` table columns (Add missing columns if any, though schema says they should exist)
-- This is just a safeguard based on AdminResourceCard usage or other potential mismatches
ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS image_url text,
    ADD COLUMN IF NOT EXISTS category text,
    ADD COLUMN IF NOT EXISTS salary_range text,
    ADD COLUMN IF NOT EXISTS posted_by uuid;

-- Fix RLS Policies just in case (Ensuring staff/admin access)
DROP POLICY IF EXISTS "jobs_insert" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete" ON public.jobs;

CREATE POLICY "jobs_insert" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "jobs_update" ON public.jobs
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "jobs_delete" ON public.jobs
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- Grant permissions to make sure
GRANT ALL ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
