-- ============================================================
-- Migration: Fix 14 Slow ("Mabagal") RLS Policies
-- ============================================================
-- Rules applied:
--   1. InitPlan Fix: All auth.uid() wrapped in (SELECT auth.uid())
--   2. No Circular Reference: No subquery on profiles from profiles table
--   3. No Admins Table: Admin check uses public.profiles.role
--   4. Admin role check cached as single InitPlan subquery
-- ============================================================

-- ============================================================
-- STEP 1: Drop ALL existing policies on the 10 target tables
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
        'alumni_feedback',
        'alumni_newsletters',
        'alumni_surveys',
        'batch_reunions',
        'donations',
        'forum_posts',
        'job_applications',
        'messages',
        'notifications',
        'reunion_attendees'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _pol.tablename);
  END LOOP;
END $$;

-- ============================================================
-- STEP 2: Ensure RLS is enabled on all target tables
-- ============================================================
ALTER TABLE IF EXISTS public.alumni_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alumni_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.batch_reunions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reunion_attendees ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Create optimized RLS policies
-- ============================================================
-- Pattern used for admin checks (evaluated once via InitPlan):
--   (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
--     IN ('admin', 'super_admin')
-- ============================================================

-- ************************************************************
-- alumni_feedback (has alumni_id column)
-- ************************************************************

-- Alumni see own feedback; admins see all
CREATE POLICY "alumni_feedback_select"
  ON public.alumni_feedback FOR SELECT
  TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Alumni create own feedback only
CREATE POLICY "alumni_feedback_insert"
  ON public.alumni_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    alumni_id = (SELECT auth.uid())
  );

-- Admins update feedback (admin_reply, status)
CREATE POLICY "alumni_feedback_update"
  ON public.alumni_feedback FOR UPDATE
  TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    alumni_id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Admins delete feedback
CREATE POLICY "alumni_feedback_delete"
  ON public.alumni_feedback FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- alumni_newsletters (no user_id - admin-managed content)
-- ************************************************************

-- All authenticated users can read newsletters
CREATE POLICY "alumni_newsletters_select"
  ON public.alumni_newsletters FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create newsletters
CREATE POLICY "alumni_newsletters_insert"
  ON public.alumni_newsletters FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Only admins can update newsletters
CREATE POLICY "alumni_newsletters_update"
  ON public.alumni_newsletters FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Only admins can delete newsletters
CREATE POLICY "alumni_newsletters_delete"
  ON public.alumni_newsletters FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- alumni_surveys (no user_id - admin-managed content)
-- ************************************************************

-- All authenticated users can read surveys
CREATE POLICY "alumni_surveys_select"
  ON public.alumni_surveys FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create surveys
CREATE POLICY "alumni_surveys_insert"
  ON public.alumni_surveys FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Only admins can update surveys
CREATE POLICY "alumni_surveys_update"
  ON public.alumni_surveys FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Only admins can delete surveys
CREATE POLICY "alumni_surveys_delete"
  ON public.alumni_surveys FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- batch_reunions (no user_id - admin-managed events)
-- ************************************************************

-- All authenticated users can read reunions
CREATE POLICY "batch_reunions_select"
  ON public.batch_reunions FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create reunions
CREATE POLICY "batch_reunions_insert"
  ON public.batch_reunions FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Only admins can update reunions
CREATE POLICY "batch_reunions_update"
  ON public.batch_reunions FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Only admins can delete reunions
CREATE POLICY "batch_reunions_delete"
  ON public.batch_reunions FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- donations (public donation page - anon users can insert)
-- ************************************************************

-- Admins can see all donations
CREATE POLICY "donations_select"
  ON public.donations FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Anyone (including anon/public) can create donations
CREATE POLICY "donations_insert_anon"
  ON public.donations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "donations_insert_authenticated"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can update donations (verify status)
CREATE POLICY "donations_update"
  ON public.donations FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Only admins can delete donations
CREATE POLICY "donations_delete"
  ON public.donations FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- forum_posts (has user_id column)
-- ************************************************************

-- All authenticated users can read all posts
CREATE POLICY "forum_posts_select"
  ON public.forum_posts FOR SELECT
  TO authenticated
  USING (true);

-- Users create their own posts only
CREATE POLICY "forum_posts_insert"
  ON public.forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- Users update own posts; admins update any
CREATE POLICY "forum_posts_update"
  ON public.forum_posts FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Users delete own posts; admins delete any
CREATE POLICY "forum_posts_delete"
  ON public.forum_posts FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );


-- ************************************************************
-- job_applications (has alumni_id column)
-- ************************************************************

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_applications') THEN

    EXECUTE 'CREATE POLICY "job_applications_select"
      ON public.job_applications FOR SELECT
      TO authenticated
      USING (
        alumni_id = (SELECT auth.uid())
        OR
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin'')
      )';

    EXECUTE 'CREATE POLICY "job_applications_insert"
      ON public.job_applications FOR INSERT
      TO authenticated
      WITH CHECK (
        alumni_id = (SELECT auth.uid())
      )';

    EXECUTE 'CREATE POLICY "job_applications_update"
      ON public.job_applications FOR UPDATE
      TO authenticated
      USING (
        alumni_id = (SELECT auth.uid())
        OR
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin'')
      )
      WITH CHECK (
        alumni_id = (SELECT auth.uid())
        OR
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin'')
      )';

    EXECUTE 'CREATE POLICY "job_applications_delete"
      ON public.job_applications FOR DELETE
      TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN (''admin'', ''super_admin'')
      )';

  END IF;
END $$;


-- ************************************************************
-- messages (has sender_id, receiver_id)
-- ************************************************************

-- Users see messages they sent or received
CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    sender_id = (SELECT auth.uid())
    OR
    receiver_id = (SELECT auth.uid())
  );

-- Users send messages as themselves
CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
  );

-- Users can update messages they received (mark as read)
CREATE POLICY "messages_update"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    receiver_id = (SELECT auth.uid())
  )
  WITH CHECK (
    receiver_id = (SELECT auth.uid())
  );

-- Users delete own sent/received messages
CREATE POLICY "messages_delete"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
    sender_id = (SELECT auth.uid())
    OR
    receiver_id = (SELECT auth.uid())
  );


-- ************************************************************
-- notifications (has user_id column)
-- ************************************************************

-- Users see own notifications only
CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  );

-- Admins can create notifications; system uses service_role which bypasses RLS
CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );

-- Users update own notifications (mark as read)
CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- Users delete own notifications
CREATE POLICY "notifications_delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
  );


-- ************************************************************
-- reunion_attendees (has alumni_id, reunion_id)
-- ************************************************************

-- All authenticated users can see attendees
CREATE POLICY "reunion_attendees_select"
  ON public.reunion_attendees FOR SELECT
  TO authenticated
  USING (true);

-- Alumni register themselves only
CREATE POLICY "reunion_attendees_insert"
  ON public.reunion_attendees FOR INSERT
  TO authenticated
  WITH CHECK (
    alumni_id = (SELECT auth.uid())
  );

-- Alumni update own attendance status
CREATE POLICY "reunion_attendees_update"
  ON public.reunion_attendees FOR UPDATE
  TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
  )
  WITH CHECK (
    alumni_id = (SELECT auth.uid())
  );

-- Alumni remove own attendance; admins remove any
CREATE POLICY "reunion_attendees_delete"
  ON public.reunion_attendees FOR DELETE
  TO authenticated
  USING (
    alumni_id = (SELECT auth.uid())
    OR
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin')
  );
