-- ==============================================================================
-- Migration: 20260315_phase2_dashboard_stats_rpc.sql
-- Description:
--   Single performant RPC for administrative dashboard statistics.
--   Replaces 10 individual HTTP count queries with 1 fast aggregated database query.
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
  -- 1. Aggregate all profile counts in a single pass
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni'), 0),
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni' AND status = 'master_list'), 0),
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni' AND status = 'verified'), 0),
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni' AND status = 'rejected'), 0),
    COALESCE(COUNT(*) FILTER (WHERE role = 'alumni' AND status = 'pending_approval'), 0)
  INTO
    v_total, v_unclaimed, v_verified, v_rejected, v_pending
  FROM public.profiles;

  -- 2. Query module metrics
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_applications') THEN
    SELECT COALESCE(COUNT(*), 0) INTO v_pending_apps FROM public.subscription_applications WHERE status = 'pending';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alumni_events') THEN
    SELECT COALESCE(COUNT(*), 0) INTO v_events FROM public.alumni_events WHERE status = 'active';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    SELECT COALESCE(COUNT(*), 0) INTO v_jobs FROM public.jobs WHERE status = 'active';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'donation_campaigns') THEN
    SELECT COALESCE(COUNT(*), 0) INTO v_campaigns FROM public.donation_campaigns WHERE status = 'active';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news_articles') THEN
    SELECT COALESCE(COUNT(*), 0) INTO v_news FROM public.news_articles WHERE is_published = true;
  END IF;

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

-- Grant execution to staff and administrators
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;

