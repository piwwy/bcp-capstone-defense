-- ================================================================
-- FIX MIGRATION: Missing alumni_resources table + contact_inquiries.admin_notes
-- Date: 2026-02-17 22:00
-- ================================================================
-- BEFORE running this, backups have been saved:
--   FRESH_PROJECT_SETUP_BACKUP_20260217.sql
--   20260217130000_fix_rls_BACKUP_20260217.sql
-- ================================================================


-- ================================================================
-- FIX 1: Create missing "alumni_resources" table
-- The code (ManageResources.tsx, AlumniResources.tsx) uses this table
-- but it was NEVER created — gives 404 on the API.
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Other',
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size BIGINT DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- FIX 2: Add missing "admin_notes" column to contact_inquiries
-- PartnerInquiries.tsx tries to UPDATE this column but it doesn't exist
-- ================================================================
ALTER TABLE public.contact_inquiries
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;


-- ================================================================
-- FIX 3: Enable RLS on alumni_resources
-- ================================================================
ALTER TABLE public.alumni_resources ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- FIX 4: RLS policies for alumni_resources
-- Admin/staff can manage, authenticated can view published
-- ================================================================
CREATE POLICY "alumni_resources_select" ON public.alumni_resources
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "alumni_resources_insert" ON public.alumni_resources
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "alumni_resources_update" ON public.alumni_resources
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "alumni_resources_delete" ON public.alumni_resources
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );


-- ================================================================
-- FIX 5: Grants for alumni_resources
-- ================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alumni_resources TO authenticated;


-- ================================================================
-- FIX 6: Add Realtime subscriptions for tables used by code
-- These are used in DashboardAdmin.tsx, DonationCollections.tsx,
-- ManageNews.tsx, CareerTracking.tsx, etc.
-- ================================================================
-- Only add tables that aren't already in realtime publication.
-- We use DO block to safely check before adding.
DO $$
BEGIN
  -- donations (used by DonationCollections.tsx realtime)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'donations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
  END IF;

  -- news_articles (used by ManageNews.tsx realtime)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'news_articles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.news_articles;
  END IF;

  -- alumni_events (used by DashboardAdmin.tsx realtime)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'alumni_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alumni_events;
  END IF;

  -- jobs (used by DashboardAdmin.tsx realtime)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
  END IF;

  -- donation_campaigns (used by DashboardAdmin.tsx realtime)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'donation_campaigns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_campaigns;
  END IF;

  -- announcements (used by Announcements.tsx realtime)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  END IF;
END;
$$;


-- ================================================================
-- DONE!
-- ================================================================
-- Changes applied:
--   1. ✅ Created alumni_resources table (was missing — 404 error)
--   2. ✅ Added admin_notes column to contact_inquiries (was missing)
--   3. ✅ Enabled RLS on alumni_resources
--   4. ✅ Added RLS policies for alumni_resources
--   5. ✅ Granted permissions for alumni_resources
--   6. ✅ Added Realtime subscriptions for donations, news_articles,
--         alumni_events, jobs, donation_campaigns, announcements
-- ================================================================
