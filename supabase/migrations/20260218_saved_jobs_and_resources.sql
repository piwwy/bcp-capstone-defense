-- Migration to add saved jobs table and seed career guides
CREATE TABLE IF NOT EXISTS public.alumni_saved_jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alumni_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(alumni_id, job_id)
);

-- RLS for saved jobs
ALTER TABLE public.alumni_saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved jobs"
    ON public.alumni_saved_jobs
    FOR ALL
    TO authenticated
    USING (auth.uid() = alumni_id)
    WITH CHECK (auth.uid() = alumni_id);

GRANT ALL ON public.alumni_saved_jobs TO authenticated;
GRANT ALL ON public.alumni_saved_jobs TO service_role;

-- Seed sample career guides with analytics-based insights
INSERT INTO public.alumni_resources (title, description, category, file_url, file_name, file_type, file_size, status)
SELECT 'Mastering Remote Technical Interviews.pdf', 'Data-driven strategies for remote interviews. Based on recent 2025 hiring trends and technical feedback loops.', 'Career Guides', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Technical_Interview_Guide.pdf', 'application/pdf', 256000, 'published'
WHERE NOT EXISTS (SELECT 1 FROM public.alumni_resources WHERE title = 'Mastering Remote Technical Interviews.pdf');

INSERT INTO public.alumni_resources (title, description, category, file_url, file_name, file_type, file_size, status)
SELECT 'ATS-Optimized Resume Blueprint.pdf', 'Optimizing your resume for AI-driven screening systems. Effective for 90% of Fortune 500 applicant portals.', 'Career Guides', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'ATS_Resume_Guide.pdf', 'application/pdf', 150000, 'published'
WHERE NOT EXISTS (SELECT 1 FROM public.alumni_resources WHERE title = 'ATS-Optimized Resume Blueprint.pdf');

INSERT INTO public.alumni_resources (title, description, category, file_url, file_name, file_type, file_size, status)
SELECT 'High-Impact LinkedIn Networking.pdf', 'Statistical analysis of networking effectiveness. Learn to increase your response rate by 200% via targeted outreach.', 'Career Guides', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'LinkedIn_Networking.pdf', 'application/pdf', 320000, 'published'
WHERE NOT EXISTS (SELECT 1 FROM public.alumni_resources WHERE title = 'High-Impact LinkedIn Networking.pdf');

INSERT INTO public.alumni_resources (title, description, category, file_url, file_name, file_type, file_size, status)
SELECT 'Alumni Handbook 2026.pdf', 'Official guidelines and benefits for BCP alumni.', 'Handbooks', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Handbook_2026.pdf', 'application/pdf', 512000, 'published'
WHERE NOT EXISTS (SELECT 1 FROM public.alumni_resources WHERE category = 'Handbooks');

INSERT INTO public.alumni_resources (title, description, category, file_url, file_name, file_type, file_size, status)
SELECT 'Transcript Request Form.pdf', 'Use this form to request your official transcript of records.', 'Forms & Templates', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Transcript_Form.pdf', 'application/pdf', 102400, 'published'
WHERE NOT EXISTS (SELECT 1 FROM public.alumni_resources WHERE category = 'Forms & Templates');
