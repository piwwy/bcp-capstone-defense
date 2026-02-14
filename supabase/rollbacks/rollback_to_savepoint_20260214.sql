-- Savepoint: supabase

-- ============================================================
-- ROLLBACK SCRIPT: Revert to Savepoint 20260214
-- ============================================================
-- USE THIS if a future migration breaks the app.
-- Steps:
--   1. Run: supabase migration repair --status reverted <broken_timestamp>
--   2. Execute this script in Supabase SQL Editor
-- ============================================================

-- =============================================
-- RESTORE: profiles policies
-- =============================================
DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', _pol.policyname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')); $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- =============================================
-- RESTORE: 10 optimized table policies
-- =============================================
-- alumni_feedback
DO $$ DECLARE _pol RECORD; BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='alumni_feedback'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.alumni_feedback', _pol.policyname); END LOOP;
END $$;
ALTER TABLE IF EXISTS public.alumni_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alumni_feedback_select" ON public.alumni_feedback FOR SELECT TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "alumni_feedback_insert" ON public.alumni_feedback FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "alumni_feedback_update" ON public.alumni_feedback FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'))
  WITH CHECK (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "alumni_feedback_delete" ON public.alumni_feedback FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));

-- alumni_newsletters
DO $$ DECLARE _pol RECORD; BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='alumni_newsletters'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.alumni_newsletters', _pol.policyname); END LOOP;
END $$;
ALTER TABLE IF EXISTS public.alumni_newsletters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alumni_newsletters_select" ON public.alumni_newsletters FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_newsletters_insert" ON public.alumni_newsletters FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "alumni_newsletters_update" ON public.alumni_newsletters FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "alumni_newsletters_delete" ON public.alumni_newsletters FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));

-- alumni_surveys
DO $$ DECLARE _pol RECORD; BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='alumni_surveys'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.alumni_surveys', _pol.policyname); END LOOP;
END $$;
ALTER TABLE IF EXISTS public.alumni_surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alumni_surveys_select" ON public.alumni_surveys FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_surveys_insert" ON public.alumni_surveys FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "alumni_surveys_update" ON public.alumni_surveys FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "alumni_surveys_delete" ON public.alumni_surveys FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));

-- batch_reunions
DO $$ DECLARE _pol RECORD; BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='batch_reunions'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.batch_reunions', _pol.policyname); END LOOP;
END $$;
ALTER TABLE IF EXISTS public.batch_reunions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "batch_reunions_select" ON public.batch_reunions FOR SELECT TO authenticated USING (true);
CREATE POLICY "batch_reunions_insert" ON public.batch_reunions FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "batch_reunions_update" ON public.batch_reunions FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "batch_reunions_delete" ON public.batch_reunions FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));

-- donations
DO $$ DECLARE _pol RECORD; BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='donations'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.donations', _pol.policyname); END LOOP;
END $$;
ALTER TABLE IF EXISTS public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_select" ON public.donations FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "donations_insert_anon" ON public.donations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "donations_insert_authenticated" ON public.donations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "donations_update" ON public.donations FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "donations_delete" ON public.donations FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));

-- forum_posts
DO $$ DECLARE _pol RECORD; BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='forum_posts'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.forum_posts', _pol.policyname); END LOOP;
END $$;
ALTER TABLE IF EXISTS public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forum_posts_select" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_posts_insert" ON public.forum_posts FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "forum_posts_update" ON public.forum_posts FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "forum_posts_delete" ON public.forum_posts FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));

-- messages
DO $$ DECLARE _pol RECORD; BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='messages'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', _pol.policyname); END LOOP;
END $$;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()));
CREATE POLICY "messages_update" ON public.messages FOR UPDATE TO authenticated
  USING (receiver_id = (SELECT auth.uid())) WITH CHECK (receiver_id = (SELECT auth.uid()));
CREATE POLICY "messages_delete" ON public.messages FOR DELETE TO authenticated
  USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));

-- notifications
DO $$ DECLARE _pol RECORD; BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='notifications'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', _pol.policyname); END LOOP;
END $$;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- reunion_attendees
DO $$ DECLARE _pol RECORD; BEGIN
  FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='reunion_attendees'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.reunion_attendees', _pol.policyname); END LOOP;
END $$;
ALTER TABLE IF EXISTS public.reunion_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reunion_attendees_select" ON public.reunion_attendees FOR SELECT TO authenticated USING (true);
CREATE POLICY "reunion_attendees_insert" ON public.reunion_attendees FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "reunion_attendees_update" ON public.reunion_attendees FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid())) WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "reunion_attendees_delete" ON public.reunion_attendees FOR DELETE TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin','super_admin'));

-- job_applications (conditional - table may not exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='job_applications') THEN
    DECLARE _pol RECORD; BEGIN
      FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='job_applications'
      LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.job_applications', _pol.policyname); END LOOP;
    END;
    EXECUTE 'ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "job_applications_select" ON public.job_applications FOR SELECT TO authenticated
      USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'',''super_admin''))';
    EXECUTE 'CREATE POLICY "job_applications_insert" ON public.job_applications FOR INSERT TO authenticated
      WITH CHECK (alumni_id = (SELECT auth.uid()))';
    EXECUTE 'CREATE POLICY "job_applications_update" ON public.job_applications FOR UPDATE TO authenticated
      USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'',''super_admin''))
      WITH CHECK (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'',''super_admin''))';
    EXECUTE 'CREATE POLICY "job_applications_delete" ON public.job_applications FOR DELETE TO authenticated
      USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'',''super_admin''))';
  END IF;
END $$;

SELECT 'ROLLBACK COMPLETE: Restored to savepoint 20260214' AS result;
