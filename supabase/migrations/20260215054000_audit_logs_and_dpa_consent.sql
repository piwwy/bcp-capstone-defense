-- ============================================================
-- Migration: audit_logs table creation + dpa_consented_at column
-- Date: 2026-02-15
-- ============================================================

-- 1. Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (drop existing first to be safe)
DO $$
BEGIN
  DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
  DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Admin + staff can view
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- Admin + staff can insert
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff', 'alumni')
  );

-- 5. Add dpa_consented_at column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dpa_consented_at TIMESTAMPTZ DEFAULT NULL;

-- 6. Grant permissions
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
