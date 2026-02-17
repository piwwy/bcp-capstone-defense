-- ================================================================
-- BCP ALUMNI SYSTEM — Full Schema Migration
-- For: New Supabase project setup
-- Date: 2026-02-17
-- ================================================================
-- This creates ALL tables, functions, triggers, indexes, and RLS
-- policies from scratch. Run this on a FRESH Supabase project.
-- ================================================================
-- IMPORTANT: After running this SQL:
--   1. Create admin user in Auth > Users
--   2. Update their role in profiles table to 'admin'
--   3. Deploy edge functions: npx supabase functions deploy create-users
--   4. Update .env with new project URL and anon key
-- ================================================================


-- ================================================================
-- EXTENSIONS
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


-- ================================================================
-- TABLE: profiles (core user table, linked to auth.users)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT DEFAULT '',
  middle_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  suffix TEXT DEFAULT '',
  avatar_url TEXT,
  role TEXT DEFAULT 'alumni',
  status TEXT DEFAULT 'pending_approval',
  course TEXT,
  batch_year TEXT,
  student_id TEXT,
  verification_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
  birthday DATE,
  mobile_number TEXT,
  linkedin_url TEXT,
  auth_provider TEXT DEFAULT 'email',
  dpa_consented_at TIMESTAMPTZ,
  phone TEXT,
  address TEXT,
  bio TEXT,
  headline TEXT,
  employment_status TEXT,
  company TEXT,
  position TEXT
);

-- Unique partial index on student_id (for master list upsert)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_student_id_unique
  ON public.profiles (student_id) WHERE student_id IS NOT NULL;


-- ================================================================
-- TABLE: alumni_profiles (extended profile info)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline TEXT,
  location TEXT,
  about TEXT,
  batch_year TEXT,
  employment_status TEXT DEFAULT 'Unemployed',
  current_company TEXT,
  current_position TEXT,
  phone TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  skills TEXT[]
);


-- ================================================================
-- TABLE: alumni_experience
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company TEXT,
  position TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: alumni_education
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution TEXT,
  degree TEXT,
  field_of_study TEXT,
  start_year TEXT,
  end_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: alumni_connections
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);


-- ================================================================
-- TABLE: alumni_events
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_events (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  category TEXT,
  image_url TEXT,
  max_slots INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active'
);


-- ================================================================
-- TABLE: event_attendees
-- ================================================================
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.alumni_events(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: jobs
-- ================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  type TEXT DEFAULT 'Full-time',
  work_type TEXT DEFAULT 'On-site',
  category TEXT,
  description TEXT,
  target_courses TEXT[],
  salary_range TEXT,
  status TEXT DEFAULT 'active',
  posted_by UUID,
  image_url TEXT
);


-- ================================================================
-- TABLE: job_applications
-- ================================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',
  cover_letter TEXT,
  portfolio_url TEXT
);


-- ================================================================
-- TABLE: job_placement_logs
-- ================================================================
CREATE TABLE IF NOT EXISTS public.job_placement_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  alumni_name TEXT,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  industry TEXT,
  location TEXT,
  salary_range TEXT,
  employment_type TEXT DEFAULT 'Full-time',
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: donation_campaigns
-- ================================================================
CREATE TABLE IF NOT EXISTS public.donation_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC,
  current_amount NUMERIC DEFAULT 0,
  category TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);


-- ================================================================
-- TABLE: donations
-- ================================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.donation_campaigns(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  proof_url TEXT,
  status TEXT DEFAULT 'pending',
  admin_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  guest_name TEXT,
  guest_email TEXT,
  proof_image_url TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT
);


-- ================================================================
-- TABLE: news_articles
-- ================================================================
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'campus',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: notifications
-- ================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'event_reminder' NOT NULL,
  event_id UUID,  -- Generic reference (can be event, survey, etc.)
  reference_type TEXT DEFAULT 'event',
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Unique index for dedup (prevents 409 Conflict on duplicate notifications)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_event_unique
  ON public.notifications (user_id, event_id)
  WHERE event_id IS NOT NULL;


-- ================================================================
-- TABLE: alumni_surveys
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: alumni_survey_responses
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.alumni_surveys(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: alumni_feedback
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  alumni_name TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: alumni_newsletters
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_newsletters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category TEXT DEFAULT 'General',
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: newsletter_subscribers
-- ================================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  alumni_name TEXT,
  email TEXT NOT NULL,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: forum_posts
-- ================================================================
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: forum_comments
-- ================================================================
CREATE TABLE IF NOT EXISTS public.forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: forum_likes
-- ================================================================
CREATE TABLE IF NOT EXISTS public.forum_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);


-- ================================================================
-- TABLE: messages
-- ================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_type TEXT
);


-- ================================================================
-- TABLE: batch_reunions
-- ================================================================
CREATE TABLE IF NOT EXISTS public.batch_reunions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  batch_year TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  image_url TEXT,
  organizer_name TEXT,
  max_attendees INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: reunion_attendees
-- ================================================================
CREATE TABLE IF NOT EXISTS public.reunion_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reunion_id UUID NOT NULL REFERENCES public.batch_reunions(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: announcements
-- ================================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  target_audience JSONB,
  sent_email BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: contact_inquiries
-- ================================================================
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_type TEXT NOT NULL,
  name TEXT,
  email TEXT,
  message TEXT,
  company_name TEXT,
  contact_person TEXT,
  company_email TEXT,
  company_phone TEXT,
  position_offered TEXT,
  company_message TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  routed_to_osa BOOLEAN DEFAULT false NOT NULL,
  routed_to_hr BOOLEAN DEFAULT false NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- ================================================================
-- TABLE: audit_logs
-- ================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: alumni_master_list
-- ================================================================
CREATE TABLE IF NOT EXISTS public.alumni_master_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  course TEXT NOT NULL,
  batch_year TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);


-- ================================================================
-- TABLE: alumni_resources (uploaded files/documents for alumni)
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
-- FUNCTION: is_admin() — Safe admin check (avoids RLS recursion)
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
-- FUNCTION: handle_new_user() — Auto-create profile on signup
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, first_name, last_name,
    role, status, auth_provider, created_at
  ) VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'master_list'),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ================================================================
-- FUNCTION: generate_event_reminders()
-- ================================================================
CREATE OR REPLACE FUNCTION public.generate_event_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event RECORD;
  _profile RECORD;
BEGIN
  FOR _event IN
    SELECT id, title FROM public.alumni_events
    WHERE status = 'active'
      AND date > now()
      AND date < now() + interval '2 days'
  LOOP
    FOR _profile IN
      SELECT id FROM public.profiles WHERE role = 'alumni'
    LOOP
      INSERT INTO public.notifications (user_id, title, message, type, event_id)
      VALUES (
        _profile.id,
        'Event Reminder: ' || _event.title,
        'Reminder: "' || _event.title || '" is happening soon!',
        'event_reminder',
        _event.id
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;


-- ================================================================
-- GRANTS: Give authenticated users access to all tables
-- ================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.donations TO anon;
GRANT SELECT ON public.donation_campaigns TO anon;
GRANT INSERT ON public.contact_inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alumni_resources TO authenticated;


-- ================================================================
-- ENABLE RLS ON ALL TABLES
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_placement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_reunions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reunion_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_master_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_resources ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- RLS POLICIES
-- ================================================================

-- ---- profiles ----
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff')
  );

-- ---- alumni_profiles ----
CREATE POLICY "alumni_profiles_select" ON public.alumni_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_profiles_insert" ON public.alumni_profiles
  FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "alumni_profiles_update" ON public.alumni_profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK (id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- alumni_experience ----
CREATE POLICY "alumni_experience_select" ON public.alumni_experience
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_experience_insert" ON public.alumni_experience
  FOR INSERT TO authenticated WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "alumni_experience_update" ON public.alumni_experience
  FOR UPDATE TO authenticated USING (alumni_id = (SELECT auth.uid())) WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "alumni_experience_delete" ON public.alumni_experience
  FOR DELETE TO authenticated USING (alumni_id = (SELECT auth.uid()));

-- ---- alumni_education ----
CREATE POLICY "alumni_education_select" ON public.alumni_education
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_education_insert" ON public.alumni_education
  FOR INSERT TO authenticated WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "alumni_education_update" ON public.alumni_education
  FOR UPDATE TO authenticated USING (alumni_id = (SELECT auth.uid())) WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "alumni_education_delete" ON public.alumni_education
  FOR DELETE TO authenticated USING (alumni_id = (SELECT auth.uid()));

-- ---- alumni_connections ----
CREATE POLICY "alumni_connections_select" ON public.alumni_connections
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_connections_insert" ON public.alumni_connections
  FOR INSERT TO authenticated WITH CHECK (follower_id = (SELECT auth.uid()));
CREATE POLICY "alumni_connections_delete" ON public.alumni_connections
  FOR DELETE TO authenticated USING (follower_id = (SELECT auth.uid()));

-- ---- alumni_events ----
CREATE POLICY "alumni_events_select" ON public.alumni_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_events_insert" ON public.alumni_events
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_events_update" ON public.alumni_events
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_events_delete" ON public.alumni_events
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- event_attendees ----
CREATE POLICY "event_attendees_select" ON public.event_attendees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "event_attendees_insert" ON public.event_attendees
  FOR INSERT TO authenticated WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "event_attendees_update" ON public.event_attendees
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "event_attendees_delete" ON public.event_attendees
  FOR DELETE TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- jobs ----
CREATE POLICY "jobs_select" ON public.jobs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "jobs_insert" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "jobs_update" ON public.jobs
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "jobs_delete" ON public.jobs
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- job_applications ----
CREATE POLICY "job_applications_select" ON public.job_applications
  FOR SELECT TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "job_applications_insert" ON public.job_applications
  FOR INSERT TO authenticated WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "job_applications_update" ON public.job_applications
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "job_applications_delete" ON public.job_applications
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- job_placement_logs ----
CREATE POLICY "job_placement_logs_select" ON public.job_placement_logs
  FOR SELECT TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "job_placement_logs_insert" ON public.job_placement_logs
  FOR INSERT TO authenticated
  WITH CHECK (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "job_placement_logs_update" ON public.job_placement_logs
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "job_placement_logs_delete" ON public.job_placement_logs
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- donation_campaigns ----
CREATE POLICY "donation_campaigns_select" ON public.donation_campaigns
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "donation_campaigns_select_anon" ON public.donation_campaigns
  FOR SELECT TO anon USING (true);
CREATE POLICY "donation_campaigns_insert" ON public.donation_campaigns
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "donation_campaigns_update" ON public.donation_campaigns
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "donation_campaigns_delete" ON public.donation_campaigns
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- donations ----
CREATE POLICY "donations_select" ON public.donations
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "donations_insert_anon" ON public.donations
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "donations_insert_authenticated" ON public.donations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "donations_update" ON public.donations
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "donations_delete" ON public.donations
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- news_articles ----
CREATE POLICY "news_articles_select" ON public.news_articles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "news_articles_insert" ON public.news_articles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "news_articles_update" ON public.news_articles
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "news_articles_delete" ON public.news_articles
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- notifications ----
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ---- alumni_surveys ----
CREATE POLICY "alumni_surveys_select" ON public.alumni_surveys
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_surveys_insert" ON public.alumni_surveys
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_surveys_update" ON public.alumni_surveys
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_surveys_delete" ON public.alumni_surveys
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- alumni_survey_responses ----
CREATE POLICY "alumni_survey_responses_select" ON public.alumni_survey_responses
  FOR SELECT TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_survey_responses_insert" ON public.alumni_survey_responses
  FOR INSERT TO authenticated WITH CHECK (alumni_id = (SELECT auth.uid()));

-- ---- alumni_feedback ----
CREATE POLICY "alumni_feedback_select" ON public.alumni_feedback
  FOR SELECT TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_feedback_insert" ON public.alumni_feedback
  FOR INSERT TO authenticated WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "alumni_feedback_update" ON public.alumni_feedback
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_feedback_delete" ON public.alumni_feedback
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- alumni_newsletters ----
CREATE POLICY "alumni_newsletters_select" ON public.alumni_newsletters
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_newsletters_insert" ON public.alumni_newsletters
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_newsletters_update" ON public.alumni_newsletters
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_newsletters_delete" ON public.alumni_newsletters
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- newsletter_subscribers ----
CREATE POLICY "newsletter_subscribers_select" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "newsletter_subscribers_insert" ON public.newsletter_subscribers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "newsletter_subscribers_update" ON public.newsletter_subscribers
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid())) WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "newsletter_subscribers_delete" ON public.newsletter_subscribers
  FOR DELETE TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- forum_posts ----
CREATE POLICY "forum_posts_select" ON public.forum_posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_posts_insert" ON public.forum_posts
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "forum_posts_update" ON public.forum_posts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "forum_posts_delete" ON public.forum_posts
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- forum_comments ----
CREATE POLICY "forum_comments_select" ON public.forum_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_comments_insert" ON public.forum_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "forum_comments_update" ON public.forum_comments
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "forum_comments_delete" ON public.forum_comments
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- forum_likes ----
CREATE POLICY "forum_likes_select" ON public.forum_likes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "forum_likes_insert" ON public.forum_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "forum_likes_delete" ON public.forum_likes
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ---- messages ----
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = (SELECT auth.uid()));
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (receiver_id = (SELECT auth.uid())) WITH CHECK (receiver_id = (SELECT auth.uid()));
CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));

-- ---- batch_reunions ----
CREATE POLICY "batch_reunions_select" ON public.batch_reunions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "batch_reunions_insert" ON public.batch_reunions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "batch_reunions_update" ON public.batch_reunions
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "batch_reunions_delete" ON public.batch_reunions
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- reunion_attendees ----
CREATE POLICY "reunion_attendees_select" ON public.reunion_attendees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "reunion_attendees_insert" ON public.reunion_attendees
  FOR INSERT TO authenticated WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "reunion_attendees_update" ON public.reunion_attendees
  FOR UPDATE TO authenticated
  USING (alumni_id = (SELECT auth.uid())) WITH CHECK (alumni_id = (SELECT auth.uid()));
CREATE POLICY "reunion_attendees_delete" ON public.reunion_attendees
  FOR DELETE TO authenticated
  USING (alumni_id = (SELECT auth.uid()) OR (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- announcements ----
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "announcements_update" ON public.announcements
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "announcements_delete" ON public.announcements
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- contact_inquiries ----
CREATE POLICY "contact_inquiries_select" ON public.contact_inquiries
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "contact_inquiries_insert_anon" ON public.contact_inquiries
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "contact_inquiries_insert_auth" ON public.contact_inquiries
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contact_inquiries_update" ON public.contact_inquiries
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "contact_inquiries_delete" ON public.contact_inquiries
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- audit_logs ----
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- ---- alumni_master_list ----
CREATE POLICY "alumni_master_list_select" ON public.alumni_master_list
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_master_list_insert" ON public.alumni_master_list
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_master_list_delete" ON public.alumni_master_list
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));

-- ---- alumni_resources ----
CREATE POLICY "alumni_resources_select" ON public.alumni_resources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alumni_resources_insert" ON public.alumni_resources
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_resources_update" ON public.alumni_resources
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'))
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));
CREATE POLICY "alumni_resources_delete" ON public.alumni_resources
  FOR DELETE TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'super_admin', 'superadmin', 'staff'));


-- ================================================================
-- ENABLE REALTIME for key tables
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news_articles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alumni_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donation_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;


-- ================================================================
-- DONE! Schema migration complete.
-- ================================================================
-- Next steps:
--   1. Create admin user: Auth > Users > Add User
--   2. Set their role: UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
--   3. Deploy edge function: npx supabase functions deploy create-users
--   4. Update .env with new VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
-- ================================================================
