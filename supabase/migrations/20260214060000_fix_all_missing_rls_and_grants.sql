-- ============================================================
-- Migration: Fix ALL missing RLS policies + table grants
-- ============================================================
-- Previous migration covered 11 tables. This covers the
-- remaining 17+ tables that are causing:
--   - "permission denied for table X"
--   - "Access Restricted - needs RLS policies"
--   - Infinite loading / skeleton screens
--
-- Rules (same as before):
--   1. (SELECT auth.uid()) for InitPlan performance
--   2. No circular reference on profiles table
--   3. Admin check via profiles.role
-- ============================================================

-- ============================================================
-- STEP 1: GRANT table-level permissions to authenticated/anon
-- (Without these, even with RLS policies, queries fail with
--  "permission denied for table X")
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
    EXECUTE format('GRANT SELECT, INSERT ON public.%I TO anon', _tbl);
  END LOOP;
END $$;

-- Also grant on sequences (for auto-increment IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================================
-- STEP 2: Drop existing policies on NEW tables (clean slate)
-- ============================================================
DO $$
DECLARE
  _pol RECORD;
BEGIN
  FOR _pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'alumni_profiles', 'alumni_experience', 'alumni_education',
        'jobs', 'job_placement_logs', 'donation_campaigns',
        'announcements', 'news_articles', 'alumni_events',
        'event_attendees', 'alumni_survey_responses',
        'newsletter_subscribers', 'forum_likes', 'forum_comments',
        'alumni_connections', 'audit_logs'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _pol.tablename);
  END LOOP;
END $$;

-- ============================================================
-- STEP 3: Enable RLS on all tables
-- ============================================================
ALTER TABLE IF EXISTS public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_placement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create RLS policies for each table
-- ============================================================

-- ************************************************************
-- alumni_profiles (id = profiles.id, extended profile data)
-- ************************************************************
CREATE POLICY "alumni_profiles_select" ON public.alumni_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alumni_profiles_insert" ON public.alumni_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "alumni_profiles_update" ON public.alumni_profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));


-- ************************************************************
-- alumni_experience (alumni_id FK)
-- ************************************************************
CREATE POLICY "alumni_experience_select" ON public.alumni_experience
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alumni_experience_insert" ON public.alumni_experience
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "alumni_experience_delete" ON public.alumni_experience
  FOR DELETE TO authenticated
  USING (alumni_id = (SELECT auth.uid()));


-- ************************************************************
-- alumni_education (alumni_id FK)
-- ************************************************************
CREATE POLICY "alumni_education_select" ON public.alumni_education
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alumni_education_insert" ON public.alumni_education
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "alumni_education_delete" ON public.alumni_education
  FOR DELETE TO authenticated
  USING (alumni_id = (SELECT auth.uid()));


-- ************************************************************
-- jobs (no user FK - admin-managed job board)
-- ************************************************************
CREATE POLICY "jobs_select" ON public.jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "jobs_insert" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "jobs_update" ON public.jobs
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "jobs_delete" ON public.jobs
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- job_placement_logs (alumni_id FK)
-- ************************************************************
CREATE POLICY "job_placement_logs_select" ON public.job_placement_logs
  FOR SELECT TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "job_placement_logs_insert" ON public.job_placement_logs
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "job_placement_logs_update" ON public.job_placement_logs
  FOR UPDATE TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- donation_campaigns (no user FK - admin-managed + public read)
-- ************************************************************
CREATE POLICY "donation_campaigns_select_auth" ON public.donation_campaigns
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "donation_campaigns_select_anon" ON public.donation_campaigns
  FOR SELECT TO anon USING (true);

CREATE POLICY "donation_campaigns_insert" ON public.donation_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "donation_campaigns_update" ON public.donation_campaigns
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- announcements (user_id = creator FK)
-- ************************************************************
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "announcements_update" ON public.announcements
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "announcements_delete" ON public.announcements
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- news_articles (user_id = creator FK)
-- ************************************************************
CREATE POLICY "news_articles_select" ON public.news_articles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "news_articles_insert" ON public.news_articles
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "news_articles_update" ON public.news_articles
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "news_articles_delete" ON public.news_articles
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- alumni_events (no user FK - admin-managed events)
-- ************************************************************
CREATE POLICY "alumni_events_select" ON public.alumni_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alumni_events_insert" ON public.alumni_events
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "alumni_events_update" ON public.alumni_events
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "alumni_events_delete" ON public.alumni_events
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- event_attendees (alumni_id FK)
-- ************************************************************
CREATE POLICY "event_attendees_select" ON public.event_attendees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "event_attendees_insert" ON public.event_attendees
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "event_attendees_update" ON public.event_attendees
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()))
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "event_attendees_delete" ON public.event_attendees
  FOR DELETE TO authenticated
  USING (alumni_id = (SELECT auth.uid()));


-- ************************************************************
-- alumni_survey_responses (alumni_id FK)
-- ************************************************************
CREATE POLICY "alumni_survey_responses_select" ON public.alumni_survey_responses
  FOR SELECT TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "alumni_survey_responses_insert" ON public.alumni_survey_responses
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));


-- ************************************************************
-- newsletter_subscribers (alumni_id FK)
-- ************************************************************
CREATE POLICY "newsletter_subscribers_select" ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "newsletter_subscribers_insert" ON public.newsletter_subscribers
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));

CREATE POLICY "newsletter_subscribers_update" ON public.newsletter_subscribers
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()))
  WITH CHECK (alumni_id = (SELECT auth.uid()));


-- ************************************************************
-- forum_likes (user_id FK)
-- ************************************************************
CREATE POLICY "forum_likes_select" ON public.forum_likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "forum_likes_insert" ON public.forum_likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "forum_likes_delete" ON public.forum_likes
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));


-- ************************************************************
-- forum_comments (user_id FK)
-- ************************************************************
CREATE POLICY "forum_comments_select" ON public.forum_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "forum_comments_insert" ON public.forum_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "forum_comments_delete" ON public.forum_comments
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- alumni_connections (follower_id, following_id FKs)
-- ************************************************************
CREATE POLICY "alumni_connections_select" ON public.alumni_connections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alumni_connections_insert" ON public.alumni_connections
  FOR INSERT TO authenticated
  WITH CHECK (follower_id = (SELECT auth.uid()));

CREATE POLICY "alumni_connections_delete" ON public.alumni_connections
  FOR DELETE TO authenticated
  USING (follower_id = (SELECT auth.uid()));


-- ************************************************************
-- audit_logs (user_id FK - admin only)
-- ************************************************************
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ============================================================
-- STEP 5: Handle optional/legacy tables safely
-- ============================================================
DO $$
BEGIN
  -- alumni_accounts (legacy table)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alumni_accounts') THEN
    EXECUTE 'ALTER TABLE public.alumni_accounts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "alumni_accounts_select" ON public.alumni_accounts FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "alumni_accounts_insert" ON public.alumni_accounts FOR INSERT TO authenticated WITH CHECK (true)';
  END IF;

  -- news (may be a view or alias of news_articles)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news' AND table_type = 'BASE TABLE') THEN
    EXECUTE 'ALTER TABLE public.news ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "news_select" ON public.news FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "news_insert" ON public.news FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin''))';
    EXECUTE 'CREATE POLICY "news_update" ON public.news FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin'')) WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin''))';
  END IF;
END $$;

-- ============================================================
-- STEP 6: Fix "permission denied for table users" error
-- Grant read access to auth.users if a view references it
-- ============================================================
DO $$
BEGIN
  -- If there's a public.users view, grant access
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'users') THEN
    EXECUTE 'GRANT SELECT ON public.users TO authenticated';
  END IF;
END $$;
