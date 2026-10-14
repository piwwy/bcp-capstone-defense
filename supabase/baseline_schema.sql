-- ==============================================================================
-- BCP ALUMNI PORTAL — Master Production Baseline Schema
-- File: supabase/baseline_schema.sql
-- Description:
--   Consolidated, idempotent database schema for the BCP Alumni Management System.
--   Includes all 34 core tables, performance indexes, security triggers,
--   non-recursive RLS helper functions, and aggregated dashboard RPCs.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ==============================================================================
-- 2. CORE DOMAIN TABLES
-- ==============================================================================

-- 2.1 Profiles (Primary user table linked to auth.users)
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
  position TEXT,
  last_login TIMESTAMPTZ
);

-- 2.2 Alumni Profiles (Extended career & portfolio details)
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
  skills TEXT[],
  industry TEXT,
  years_experience NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Alumni Experience
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

-- 2.4 Alumni Education
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

-- 2.5 Alumni Connections (Followers / Network)
CREATE TABLE IF NOT EXISTS public.alumni_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- 2.6 Alumni Events
CREATE TABLE IF NOT EXISTS public.alumni_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 2.7 Event Attendees
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.alumni_events(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, alumni_id)
);

-- 2.8 Job Board
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
  posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  image_url TEXT
);

-- 2.9 Job Applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending',
  cover_letter TEXT,
  portfolio_url TEXT
);

-- 2.10 Job Placement Logs (Institutional Employment Tracking)
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

-- 2.11 Saved Jobs Bookmarks
CREATE TABLE IF NOT EXISTS public.alumni_saved_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alumni_id, job_id)
);

-- 2.12 Alumni Resources (Guides, Handbooks, Templates)
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

-- 2.13 Donation Campaigns
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

-- 2.14 Donations & Financial Records
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
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 2.15 News Articles & Campus Announcements
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

-- 2.16 User Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'event_reminder' NOT NULL,
  event_id UUID,
  reference_type TEXT DEFAULT 'event',
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.17 Surveys
CREATE TABLE IF NOT EXISTS public.alumni_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.18 Survey Responses (Tracer Studies)
CREATE TABLE IF NOT EXISTS public.alumni_survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.alumni_surveys(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.19 Alumni Feedback
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

-- 2.20 Newsletters
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

-- 2.21 Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  alumni_name TEXT,
  email TEXT NOT NULL,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.22 Community Forum Posts
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'general',
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.23 Community Forum Comments
CREATE TABLE IF NOT EXISTS public.forum_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.24 Community Forum Likes
CREATE TABLE IF NOT EXISTS public.forum_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 2.25 Direct Messages (Alumni & Admin Live Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.26 Batch Reunions
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

-- 2.27 Reunion Attendees
CREATE TABLE IF NOT EXISTS public.reunion_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reunion_id UUID NOT NULL REFERENCES public.batch_reunions(id) ON DELETE CASCADE,
  alumni_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.28 Announcements
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

-- 2.29 Contact & Partnership Inquiries
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
  admin_notes TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  routed_to_osa BOOLEAN DEFAULT false NOT NULL,
  routed_to_hr BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2.30 Audit Logs (Compliance & Security Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.31 Alumni Master List (Registrar Pre-Verified Roster)
CREATE TABLE IF NOT EXISTS public.alumni_master_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  course TEXT NOT NULL,
  batch_year TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 2.32 Document Requests (Registrar Diploma, TOR, Certificate Requests)
CREATE TABLE IF NOT EXISTS public.document_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_number TEXT,
  course TEXT,
  year_graduated TEXT,
  document_type TEXT NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.33 Alumni Mentors Directory
CREATE TABLE IF NOT EXISTS public.alumni_mentors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT,
  expertise TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  linkedin_url TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.34 Subscription Applications (Registrar In-Take Roster)
CREATE TABLE IF NOT EXISTS public.subscription_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  suffix TEXT,
  birthday DATE,
  email TEXT NOT NULL,
  mobile_number TEXT,
  batch_year TEXT,
  course TEXT,
  student_id TEXT,
  adviser_name TEXT,
  section TEXT,
  subscription_plan TEXT DEFAULT 'Standard Alumni',
  status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  admin_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================

-- Profiles lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_student_id_unique
  ON public.profiles (student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles(role, status);
CREATE INDEX IF NOT EXISTS idx_profiles_course_batch ON public.profiles(course, batch_year);

-- Messages thread index
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON public.messages(receiver_id, is_read);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_user_event_unique
  ON public.notifications (user_id, event_id) WHERE event_id IS NOT NULL;

-- Job Board
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON public.jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_alumni ON public.job_applications(alumni_id);

-- Events
CREATE INDEX IF NOT EXISTS idx_alumni_events_status_date ON public.alumni_events(status, date DESC);

-- Financials
CREATE INDEX IF NOT EXISTS idx_donations_campaign ON public.donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_profile ON public.donations(profile_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);

-- Inquiries & Audit Trail
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_filter ON public.contact_inquiries(inquiry_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Document Requests & Subscriptions
CREATE INDEX IF NOT EXISTS idx_document_requests_user ON public.document_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_applications_status ON public.subscription_applications(status, created_at DESC);

-- ==============================================================================
-- 4. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 4.1 Current authenticated user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()) LIMIT 1;
$$;

-- 4.2 Safe Admin/Staff Check (Avoids RLS recursion loops)
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'superadmin', 'super_admin', 'staff', 'alumni_officer', 'alumni_manager')
     FROM public.profiles
     WHERE id = (SELECT auth.uid()) LIMIT 1),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_or_staff();
$$;

-- 4.3 Auto-create profile on auth.users sign-up
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
    COALESCE(NEW.raw_user_meta_data->>'status', 'pending_approval'),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.4 Prevent Alumni Privilege Escalation (Phase 1 Security Hardening)
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  caller_uid UUID;
BEGIN
  caller_uid := auth.uid();

  -- Permit system operations initiated via service_role
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = caller_uid;

  IF (NEW.role IS DISTINCT FROM OLD.role) OR
     (NEW.status IS DISTINCT FROM OLD.status) OR
     (NEW.student_id IS DISTINCT FROM OLD.student_id) THEN

    IF caller_role IS NULL OR caller_role NOT IN ('admin', 'superadmin', 'super_admin') THEN
      RAISE EXCEPTION 'Privilege escalation detected: Only authorized administrators may change role, status, or student_id.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ==============================================================================
-- 5. PERFORMANT AGGREGATION RPCS (Phase 2 Performance)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INT := 0;
  v_unclaimed INT := 0;
  v_verified INT := 0;
  v_rejected INT := 0;
  v_pending INT := 0;
  v_pending_apps INT := 0;
  v_events INT := 0;
  v_jobs INT := 0;
  v_campaigns INT := 0;
  v_news INT := 0;
BEGIN
  -- Aggregate profile metrics in a single index-backed pass
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni'), 0),
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni' AND status = 'master_list'), 0),
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni' AND status = 'verified'), 0),
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni' AND status = 'rejected'), 0),
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni' AND status = 'pending_approval'), 0)
  INTO
    v_total, v_unclaimed, v_verified, v_rejected, v_pending
  FROM public.profiles;

  -- Active application metrics
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_applications') THEN
    SELECT COALESCE(COUNT(*), 0) INTO v_pending_apps FROM public.subscription_applications WHERE status = 'pending';
  END IF;

  -- Active module metrics
  SELECT COALESCE(COUNT(*), 0) INTO v_events FROM public.alumni_events WHERE status = 'active';
  SELECT COALESCE(COUNT(*), 0) INTO v_jobs FROM public.jobs WHERE status = 'active';
  SELECT COALESCE(COUNT(*), 0) INTO v_campaigns FROM public.donation_campaigns WHERE status = 'active';
  SELECT COALESCE(COUNT(*), 0) INTO v_news FROM public.news_articles WHERE is_published = true;

  RETURN jsonb_build_object(
    'stats', jsonb_build_object(
      'total', v_total,
      'unclaimed', v_unclaimed,
      'verified', v_verified,
      'rejected', v_rejected,
      'pending', v_pending,
      'pendingApplications', v_pending + v_pending_apps
    ),
    'modules', jsonb_build_object(
      'events', v_events,
      'jobs', v_jobs,
      'campaigns', v_campaigns,
      'news', v_news
    )
  );
END;
$$;

-- Restrict execution to staff and administrators
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ==============================================================================

-- Enable RLS across all tables
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
ALTER TABLE public.alumni_saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_resources ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_applications ENABLE ROW LEVEL SECURITY;

-- 6.1 PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_verified_or_self" ON public.profiles;
CREATE POLICY "profiles_select_verified_or_self" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    status = 'verified'
    OR id = (SELECT auth.uid())
    OR public.is_admin_or_staff()
  );

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR public.is_admin_or_staff()
  );

-- 6.2 MESSAGES POLICIES
DROP POLICY IF EXISTS "messages_select_parties" ON public.messages;
CREATE POLICY "messages_select_parties" ON public.messages
  FOR SELECT TO authenticated
  USING (
    sender_id = (SELECT auth.uid())
    OR receiver_id = (SELECT auth.uid())
    OR public.is_admin_or_staff()
  );

DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()));

-- 6.3 NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "notifications_owner_access" ON public.notifications;
CREATE POLICY "notifications_owner_access" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 6.4 DONATIONS POLICIES
DROP POLICY IF EXISTS "donations_select_owner_or_admin" ON public.donations;
CREATE POLICY "donations_select_owner_or_admin" ON public.donations
  FOR SELECT TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR public.is_admin_or_staff()
  );

DROP POLICY IF EXISTS "donations_insert_authenticated" ON public.donations;
CREATE POLICY "donations_insert_authenticated" ON public.donations
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = (SELECT auth.uid()) OR profile_id IS NULL);

-- 6.5 DOCUMENT REQUESTS POLICIES
DROP POLICY IF EXISTS "document_requests_user_or_admin" ON public.document_requests;
CREATE POLICY "document_requests_user_or_admin" ON public.document_requests
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.is_admin_or_staff()
  );

DROP POLICY IF EXISTS "document_requests_insert_user" ON public.document_requests;
CREATE POLICY "document_requests_insert_user" ON public.document_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 6.6 GENERAL CONTENT READ POLICIES (Events, Jobs, News, Campaigns)
DROP POLICY IF EXISTS "public_read_active_events" ON public.alumni_events;
CREATE POLICY "public_read_active_events" ON public.alumni_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_active_jobs" ON public.jobs;
CREATE POLICY "public_read_active_jobs" ON public.jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_campaigns" ON public.donation_campaigns;
CREATE POLICY "public_read_campaigns" ON public.donation_campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_news" ON public.news_articles;
CREATE POLICY "public_read_news" ON public.news_articles FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_resources" ON public.alumni_resources;
CREATE POLICY "public_read_resources" ON public.alumni_resources FOR SELECT USING (true);

-- 6.7 REVOKE OVER-PERMISSIVE ANONYMOUS ACCESS
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.donations FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.messages FROM anon;
REVOKE ALL ON public.notifications FROM anon;

-- Grant least privilege
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.donations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
