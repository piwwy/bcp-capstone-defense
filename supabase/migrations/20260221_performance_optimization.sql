-- ================================================================
-- PERFORMANCE OPTIMIZATION: Database Indexing & Statistics
-- Date: 2026-02-21
-- ================================================================

-- 1. Create indexes for frequently queried columns in 'profiles'
-- These move linear scans (O(n)) to constant-time lookups (O(log n))
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 2. Create indexes for foreign keys and frequent filters in other tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_alumni_events_status ON public.alumni_events(status);

-- 3. Optimize the Postgres query planner
-- This helps the database decide the best path for your queries based on current data distribution
ANALYZE public.profiles;
ANALYZE public.audit_logs;
ANALYZE public.notifications;
ANALYZE public.jobs;
ANALYZE public.alumni_events;

-- Note: VACUUM is usually handled by autovacuum in Supabase, 
-- but running ANALYZE manually after adding indexes is best practice for immediate performance gains.
