-- MIGRATION: Add missing columns for Career Tracking
-- Date: 2026-03-05
-- Description: Adds industry and years_experience to alumni_profiles table.

ALTER TABLE public.alumni_profiles 
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS years_experience NUMERIC DEFAULT 0;

-- Update RLS policies to include these columns (usually automatic, but good to check)
-- No changes needed to policies if using * or explicit columns are already set.

COMMENT ON COLUMN public.alumni_profiles.industry IS 'The industry the alumnus is currently working in';
COMMENT ON COLUMN public.alumni_profiles.years_experience IS 'Total years of professional experience';
