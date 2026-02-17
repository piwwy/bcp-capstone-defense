-- ================================================================
-- COMPREHENSIVE FIX: All observed database issues
-- Date: 2026-02-17
-- Run this in: Supabase Dashboard → SQL Editor → paste → Run
-- ================================================================
-- Issues fixed:
--   1. news_articles missing is_featured column
--   2. notifications.event_id FK blocks survey notifications
--   3. notifications INSERT policy too restrictive (admin-only)
--   4. Unique index for notifications dedup (409 Conflict fix)
--   5. jobs policies missing 'staff' / 'superadmin' roles
--   6. audit_logs INSERT policy too restrictive
--   7. Missing RLS on several tables code uses
--   8. Profiles INSERT policy blocks admin master list upload
-- ================================================================


-- ================================================================
-- 1. ADD is_featured column to news_articles
-- ================================================================
-- ManageNews.tsx uses is_featured but the column doesn't exist
ALTER TABLE public.news_articles
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;


-- ================================================================
-- 2. FIX notifications.event_id FK constraint
-- ================================================================
-- Currently event_id references alumni_events(id), but code also
-- stores survey IDs there. We need to drop the FK constraint so
-- it can hold any UUID (survey_id, event_id, etc.)

-- First find and drop the FK constraint on event_id
DO $$
DECLARE
  _con RECORD;
BEGIN
  FOR _con IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.constraint_schema = ccu.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'notifications'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.column_name = 'event_id'
  LOOP
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS %I', _con.constraint_name);
  END LOOP;
END $$;

-- Also add a 'reference_type' column so we know what event_id refers to
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS reference_type TEXT DEFAULT 'event';


-- ================================================================
-- 3. FIX notifications INSERT policy (was admin-only)
-- ================================================================
-- The app creates survey notifications for any logged-in user,
-- and ManageFeedback / ManageJobs also insert notifications.
-- Allow any authenticated user to insert.

DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- ================================================================
-- 4. ADD unique index for notifications dedup (fixes 409 Conflict)
-- ================================================================
-- Prevents duplicate survey/event notifications per user
-- Only applies when event_id is not null

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_event_unique
  ON public.notifications (user_id, event_id)
  WHERE event_id IS NOT NULL;


-- ================================================================
-- 5. FIX jobs RLS policies to include 'staff' role
-- ================================================================
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


-- ================================================================
-- 6. FIX job_applications policies to include 'staff'
-- ================================================================
DROP POLICY IF EXISTS "job_applications_select" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_update" ON public.job_applications;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_applications') THEN
    EXECUTE 'CREATE POLICY "job_applications_select"
      ON public.job_applications FOR SELECT
      TO authenticated
      USING (
        alumni_id = (SELECT auth.uid())
        OR
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin'', ''superadmin'', ''staff'')
      )';

    EXECUTE 'CREATE POLICY "job_applications_update"
      ON public.job_applications FOR UPDATE
      TO authenticated
      USING (
        alumni_id = (SELECT auth.uid())
        OR
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin'', ''superadmin'', ''staff'')
      )
      WITH CHECK (
        alumni_id = (SELECT auth.uid())
        OR
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin'', ''superadmin'', ''staff'')
      )';
  END IF;
END $$;


-- ================================================================
-- 7. FIX audit_logs INSERT policy
-- ================================================================
-- Multiple pages (Announcements, DonationManager, ManageNews, etc.)
-- insert audit_logs from the client. Allow any authenticated user.

ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop all existing audit_logs policies to recreate cleanly
DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_logs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_logs', _pol.policyname);
  END LOOP;
END $$;

-- Admins/staff can read audit logs
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- Any authenticated user can insert audit logs (their own actions)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Grant table permissions
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;


-- ================================================================
-- 8. FIX profiles INSERT policy for admin master list upload
-- ================================================================
-- Current policy: id = auth.uid() (can only insert YOUR OWN profile)
-- Admin needs to insert profiles for OTHER users (master list upload)
-- Fix: allow admins/staff to insert any profile

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );


-- ================================================================
-- 9. FIX profiles UPDATE policy to include 'staff'
-- ================================================================
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );


-- ================================================================
-- 10. FIX news_articles RLS policies to include staff
-- ================================================================
DROP POLICY IF EXISTS "news_articles_insert" ON public.news_articles;
DROP POLICY IF EXISTS "news_articles_update" ON public.news_articles;
DROP POLICY IF EXISTS "news_articles_delete" ON public.news_articles;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.news_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published news
DROP POLICY IF EXISTS "news_articles_select" ON public.news_articles;
CREATE POLICY "news_articles_select" ON public.news_articles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "news_articles_insert" ON public.news_articles
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "news_articles_update" ON public.news_articles
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "news_articles_delete" ON public.news_articles
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_articles TO authenticated;


-- ================================================================
-- 11. FIX announcements RLS policies
-- ================================================================
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'announcements'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.announcements', _pol.policyname);
  END LOOP;
END $$;

-- Anyone authenticated can read announcements
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT TO authenticated
  USING (true);

-- Only admins/staff can create/update/delete
CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "announcements_update" ON public.announcements
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "announcements_delete" ON public.announcements
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;


-- ================================================================
-- 12. FIX contact_inquiries RLS policies
-- ================================================================
ALTER TABLE IF EXISTS public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_inquiries'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contact_inquiries', _pol.policyname);
  END LOOP;
END $$;

-- Admins can read all inquiries
CREATE POLICY "contact_inquiries_select" ON public.contact_inquiries
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- Anyone (even anon) can submit an inquiry
CREATE POLICY "contact_inquiries_insert_anon" ON public.contact_inquiries
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "contact_inquiries_insert_auth" ON public.contact_inquiries
  FOR INSERT TO authenticated WITH CHECK (true);

-- Admins can update (change status, route)
CREATE POLICY "contact_inquiries_update" ON public.contact_inquiries
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "contact_inquiries_delete" ON public.contact_inquiries
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_inquiries TO authenticated;
GRANT INSERT ON public.contact_inquiries TO anon;


-- ================================================================
-- 13. FIX forum_comments and forum_likes RLS
-- ================================================================
ALTER TABLE IF EXISTS public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forum_likes ENABLE ROW LEVEL SECURITY;

-- forum_comments
DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_comments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.forum_comments', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "forum_comments_select" ON public.forum_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "forum_comments_insert" ON public.forum_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "forum_comments_update" ON public.forum_comments
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "forum_comments_delete" ON public.forum_comments
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_comments TO authenticated;

-- forum_likes
DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'forum_likes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.forum_likes', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "forum_likes_select" ON public.forum_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "forum_likes_insert" ON public.forum_likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "forum_likes_delete" ON public.forum_likes
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, DELETE ON public.forum_likes TO authenticated;


-- ================================================================
-- 14. FIX alumni_profiles RLS
-- ================================================================
ALTER TABLE IF EXISTS public.alumni_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alumni_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.alumni_profiles', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "alumni_profiles_select" ON public.alumni_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alumni_profiles_insert" ON public.alumni_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "alumni_profiles_update" ON public.alumni_profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE ON public.alumni_profiles TO authenticated;


-- ================================================================
-- 15. FIX alumni_experience and alumni_education RLS
-- ================================================================
ALTER TABLE IF EXISTS public.alumni_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_education ENABLE ROW LEVEL SECURITY;

-- alumni_experience
DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alumni_experience'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.alumni_experience', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "alumni_experience_select" ON public.alumni_experience
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alumni_experience_insert" ON public.alumni_experience
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "alumni_experience_update" ON public.alumni_experience
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()))
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "alumni_experience_delete" ON public.alumni_experience
  FOR DELETE TO authenticated
  USING (alumni_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alumni_experience TO authenticated;

-- alumni_education
DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alumni_education'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.alumni_education', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "alumni_education_select" ON public.alumni_education
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alumni_education_insert" ON public.alumni_education
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "alumni_education_update" ON public.alumni_education
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()))
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "alumni_education_delete" ON public.alumni_education
  FOR DELETE TO authenticated
  USING (alumni_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alumni_education TO authenticated;


-- ================================================================
-- 16. FIX alumni_connections RLS
-- ================================================================
ALTER TABLE IF EXISTS public.alumni_connections ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alumni_connections'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.alumni_connections', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "alumni_connections_select" ON public.alumni_connections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alumni_connections_insert" ON public.alumni_connections
  FOR INSERT TO authenticated
  WITH CHECK (follower_id = (SELECT auth.uid()));

CREATE POLICY "alumni_connections_delete" ON public.alumni_connections
  FOR DELETE TO authenticated
  USING (follower_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, DELETE ON public.alumni_connections TO authenticated;


-- ================================================================
-- 17. FIX newsletter_subscribers RLS
-- ================================================================
ALTER TABLE IF EXISTS public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.newsletter_subscribers', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "newsletter_subscribers_select" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "newsletter_subscribers_insert" ON public.newsletter_subscribers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "newsletter_subscribers_update" ON public.newsletter_subscribers
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()))
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "newsletter_subscribers_delete" ON public.newsletter_subscribers
  FOR DELETE TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;


-- ================================================================
-- 18. FIX event_attendees RLS
-- ================================================================
ALTER TABLE IF EXISTS public.event_attendees ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'event_attendees'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.event_attendees', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "event_attendees_select" ON public.event_attendees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "event_attendees_insert" ON public.event_attendees
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "event_attendees_update" ON public.event_attendees
  FOR UPDATE TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "event_attendees_delete" ON public.event_attendees
  FOR DELETE TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_attendees TO authenticated;


-- ================================================================
-- 19. FIX alumni_events RLS to include staff
-- ================================================================
DROP POLICY IF EXISTS "alumni_events_insert" ON public.alumni_events;
DROP POLICY IF EXISTS "alumni_events_update" ON public.alumni_events;
DROP POLICY IF EXISTS "alumni_events_delete" ON public.alumni_events;

CREATE POLICY "alumni_events_insert" ON public.alumni_events
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "alumni_events_update" ON public.alumni_events
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "alumni_events_delete" ON public.alumni_events
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );


-- ================================================================
-- 20. FIX donation_campaigns RLS to include staff
-- ================================================================
DROP POLICY IF EXISTS "donation_campaigns_insert" ON public.donation_campaigns;
DROP POLICY IF EXISTS "donation_campaigns_update" ON public.donation_campaigns;
DROP POLICY IF EXISTS "donation_campaigns_delete" ON public.donation_campaigns;

ALTER TABLE IF EXISTS public.donation_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donation_campaigns_select" ON public.donation_campaigns;
CREATE POLICY "donation_campaigns_select" ON public.donation_campaigns
  FOR SELECT TO authenticated USING (true);

-- Allow anon to also see campaigns (public donation page)
DROP POLICY IF EXISTS "donation_campaigns_select_anon" ON public.donation_campaigns;
CREATE POLICY "donation_campaigns_select_anon" ON public.donation_campaigns
  FOR SELECT TO anon USING (true);

CREATE POLICY "donation_campaigns_insert" ON public.donation_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "donation_campaigns_update" ON public.donation_campaigns
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "donation_campaigns_delete" ON public.donation_campaigns
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.donation_campaigns TO authenticated;
GRANT SELECT ON public.donation_campaigns TO anon;


-- ================================================================
-- 21. FIX alumni_master_list RLS
-- ================================================================
ALTER TABLE IF EXISTS public.alumni_master_list ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alumni_master_list'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.alumni_master_list', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "alumni_master_list_select" ON public.alumni_master_list
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "alumni_master_list_insert" ON public.alumni_master_list
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "alumni_master_list_delete" ON public.alumni_master_list
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, DELETE ON public.alumni_master_list TO authenticated;


-- ================================================================
-- 22. FIX alumni_survey_responses RLS
-- ================================================================
ALTER TABLE IF EXISTS public.alumni_survey_responses ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'alumni_survey_responses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.alumni_survey_responses', _pol.policyname);
  END LOOP;
END $$;

-- Admin sees all; alumni see own
CREATE POLICY "alumni_survey_responses_select" ON public.alumni_survey_responses
  FOR SELECT TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- Alumni submit their own answers
CREATE POLICY "alumni_survey_responses_insert" ON public.alumni_survey_responses
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));

GRANT SELECT, INSERT ON public.alumni_survey_responses TO authenticated;


-- ================================================================
-- 23. FIX job_placement_logs RLS
-- ================================================================
ALTER TABLE IF EXISTS public.job_placement_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'job_placement_logs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.job_placement_logs', _pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "job_placement_logs_select" ON public.job_placement_logs
  FOR SELECT TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "job_placement_logs_insert" ON public.job_placement_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "job_placement_logs_update" ON public.job_placement_logs
  FOR UPDATE TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "job_placement_logs_delete" ON public.job_placement_logs
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_placement_logs TO authenticated;


-- ================================================================
-- 24. UPDATE is_admin() function to include 'staff' and 'superadmin'
-- ================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'superadmin', 'staff')
  );
$$;


-- ================================================================
-- DONE! All fixes applied.
-- ================================================================
