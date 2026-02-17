-- Migration to fix alumni_events and audit_logs
-- 20260217230000_fix_events_and_audit.sql

-- 1. Fix alumni_events table columns
ALTER TABLE public.alumni_events 
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);

-- Update status default to pending_approval if not already
ALTER TABLE public.alumni_events ALTER COLUMN status SET DEFAULT 'pending_approval';

-- Migrate existing 'active' events to 'approved' so they show up in the new flow
UPDATE public.alumni_events SET status = 'approved' WHERE status = 'active';

-- 2. Ensure audit_logs has the right structure and permissions
-- Granting to authenticated for inserts
GRANT INSERT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing if any and recreate to be sure
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'superadmin', 'staff'));

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- 3. Fix master list related tables if needed
-- (Assuming they are fine but ensuring RLS)
ALTER TABLE public.alumni_master_list ENABLE ROW LEVEL SECURITY;

-- 4. Create an admin if not exists (for testing/recovery)
-- This is just a utility, you might want to run this manually in SQL editor
