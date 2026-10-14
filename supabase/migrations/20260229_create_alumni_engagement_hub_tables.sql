-- Migration: Create document_requests and alumni_mentors tables for Alumni Engagement Hub

-- 1. Create document_requests table
CREATE TABLE IF NOT EXISTS public.document_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    student_number text,
    course text,
    year_graduated text,
    document_type text NOT NULL,
    purpose text,
    status text NOT NULL DEFAULT 'pending',
    admin_remarks text,
    created_at timestamptz DEFAULT now()
);

-- 2. Create alumni_mentors table
CREATE TABLE IF NOT EXISTS public.alumni_mentors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    job_title text NOT NULL,
    company text,
    expertise text NOT NULL,
    contact_email text NOT NULL,
    linkedin_url text,
    is_approved boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_mentors ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for document_requests
DROP POLICY IF EXISTS "Users can view their own document requests" ON public.document_requests;
CREATE POLICY "Users can view their own document requests"
    ON public.document_requests
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin', 'super_admin', 'staff', 'alumni_officer', 'alumni_manager')
        )
    );

DROP POLICY IF EXISTS "Users can create document requests" ON public.document_requests;
CREATE POLICY "Users can create document requests"
    ON public.document_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update document requests" ON public.document_requests;
CREATE POLICY "Admins can update document requests"
    ON public.document_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin', 'super_admin', 'staff', 'alumni_officer', 'alumni_manager')
        )
    );

DROP POLICY IF EXISTS "Admins can delete document requests" ON public.document_requests;
CREATE POLICY "Admins can delete document requests"
    ON public.document_requests
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin', 'super_admin', 'staff', 'alumni_officer', 'alumni_manager')
        )
    );

-- 5. RLS Policies for alumni_mentors
DROP POLICY IF EXISTS "Authenticated users can view approved mentors" ON public.alumni_mentors;
CREATE POLICY "Authenticated users can view approved mentors"
    ON public.alumni_mentors
    FOR SELECT
    TO authenticated
    USING (
        is_approved = true 
        OR auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin', 'super_admin', 'staff', 'alumni_officer', 'alumni_manager')
        )
    );

DROP POLICY IF EXISTS "Users can insert own mentor profile" ON public.alumni_mentors;
CREATE POLICY "Users can insert own mentor profile"
    ON public.alumni_mentors
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and admins can update mentor profiles" ON public.alumni_mentors;
CREATE POLICY "Users and admins can update mentor profiles"
    ON public.alumni_mentors
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin', 'super_admin', 'staff', 'alumni_officer', 'alumni_manager')
        )
    );

DROP POLICY IF EXISTS "Admins can delete mentors" ON public.alumni_mentors;
CREATE POLICY "Admins can delete mentors"
    ON public.alumni_mentors
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin', 'super_admin', 'staff', 'alumni_officer', 'alumni_manager')
        )
    );

-- 6. Grants
GRANT ALL ON public.document_requests TO authenticated;
GRANT ALL ON public.document_requests TO service_role;
GRANT ALL ON public.alumni_mentors TO authenticated;
GRANT ALL ON public.alumni_mentors TO service_role;

-- 7. Seed Sample Initial Mentors if table is empty
INSERT INTO public.alumni_mentors (full_name, job_title, company, expertise, contact_email, linkedin_url, is_approved)
SELECT 'Engr. Ronald Gutierrez', 'Senior Software Engineer', 'Accenture Philippines', 'Web Development, Cloud Computing, System Design', 'ronald.gutierrez@alumni.bcp.edu.ph', 'https://linkedin.com', true
WHERE NOT EXISTS (SELECT 1 FROM public.alumni_mentors WHERE full_name = 'Engr. Ronald Gutierrez');

INSERT INTO public.alumni_mentors (full_name, job_title, company, expertise, contact_email, linkedin_url, is_approved)
SELECT 'Maria Santos, CPA', 'Financial Audit Specialist', 'SGV & Co.', 'Auditing, Corporate Finance, Career Advice', 'maria.santos@alumni.bcp.edu.ph', 'https://linkedin.com', true
WHERE NOT EXISTS (SELECT 1 FROM public.alumni_mentors WHERE full_name = 'Maria Santos, CPA');

INSERT INTO public.alumni_mentors (full_name, job_title, company, expertise, contact_email, linkedin_url, is_approved)
SELECT 'Mark Alvin Bautista', 'HR Operations Manager', 'Teleperformance', 'Talent Acquisition, Resume Review, Interview Coaching', 'mark.bautista@alumni.bcp.edu.ph', 'https://linkedin.com', true
WHERE NOT EXISTS (SELECT 1 FROM public.alumni_mentors WHERE full_name = 'Mark Alvin Bautista');
