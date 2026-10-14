import { useQuery } from '@tanstack/react-query';
import { supabase, executeWithTokenRefresh } from '../services/supabaseClient';

// ============================================================
// Reusable hooks for common Supabase queries
// Uses TanStack Query with automatic JWT refresh retry interceptor
// ============================================================

/** Employment status counts used by dashboards (deduplicated) */
export function useEmploymentStats() {
  return useQuery({
    queryKey: ['employment_stats'],
    queryFn: () => executeWithTokenRefresh(async () => {
      // Handle legacy values: self_employed and freelance => group under Self-Employed
      const [
        { count: employed },
        selfGroup,
        { count: unemployed },
        { count: student },
      ] = await Promise.all([
        supabase.from('alumni_profiles').select('*', { count: 'exact', head: true }).eq('employment_status', 'employed'),
        supabase.from('alumni_profiles').select('*', { count: 'exact', head: true }).in('employment_status', ['self-employed', 'self_employed', 'freelance']),
        supabase.from('alumni_profiles').select('*', { count: 'exact', head: true }).eq('employment_status', 'unemployed'),
        supabase.from('alumni_profiles').select('*', { count: 'exact', head: true }).eq('employment_status', 'student'),
      ]);
      return {
        employed: employed || 0,
        selfEmployed: (selfGroup.count as number) || 0,
        unemployed: unemployed || 0,
        student: student || 0,
      };
    }),
    staleTime: 20_000,
  });
}

/** Standard module counts; by default counts 'active/live' items to align with UI lists */
export function useModuleCounts(options?: { activeOnly?: boolean }) {
  const activeOnly = options?.activeOnly !== false; // default true
  return useQuery({
    queryKey: ['module_counts', { activeOnly }],
    queryFn: () => executeWithTokenRefresh(async () => {
      const eventQuery = supabase.from('alumni_events').select('*', { count: 'exact', head: true });
      const jobsQuery = supabase.from('jobs').select('*', { count: 'exact', head: true });
      const campaignsQuery = supabase.from('donation_campaigns').select('*', { count: 'exact', head: true });
      const newsQuery = supabase.from('news_articles').select('*', { count: 'exact', head: true });

      const queries = await Promise.all([
        (activeOnly ? eventQuery.eq('status', 'active') : eventQuery),
        (activeOnly ? jobsQuery.eq('status', 'active') : jobsQuery),
        (activeOnly ? campaignsQuery.eq('status', 'active') : campaignsQuery),
        (activeOnly ? newsQuery.eq('is_published', true) : newsQuery),
      ]);

      const [events, jobs, campaigns, news] = queries;
      return {
        events: events.count || 0,
        jobs: jobs.count || 0,
        campaigns: campaigns.count || 0,
        news: news.count || 0,
      };
    }),
    staleTime: 20_000,
  });
}

/** Fetch active jobs (cached, shared across pages) */
export function useJobs(limit?: number) {
  return useQuery({
    queryKey: ['jobs', 'active', limit],
    queryFn: () => executeWithTokenRefresh(async () => {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }),
  });
}

/** Fetch active events with attendees */
export function useEvents() {
  return useQuery({
    queryKey: ['alumni_events', 'active'],
    queryFn: () => executeWithTokenRefresh(async () => {
      const { data, error } = await supabase
        .from('alumni_events')
        .select('*, event_attendees ( alumni_id )')
        .eq('status', 'active')
        .order('date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    }),
  });
}

/** Fetch active donation campaigns */
export function useCampaigns(limit?: number) {
  return useQuery({
    queryKey: ['donation_campaigns', 'active', limit],
    queryFn: () => executeWithTokenRefresh(async () => {
      let query = supabase
        .from('donation_campaigns')
        .select('*')
        .eq('status', 'active');
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }),
  });
}

/** Fetch published news articles with author info */
export function useNewsArticles() {
  return useQuery({
    queryKey: ['news_articles', 'published'],
    queryFn: () => executeWithTokenRefresh(async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*, profiles:author_id(first_name, last_name)')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }),
  });
}

/** Fetch alumni directory (profiles + career data merged) */
export function useAlumniDirectory() {
  return useQuery({
    queryKey: ['alumni_directory'],
    queryFn: () => executeWithTokenRefresh(async () => {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, batch_year, course, avatar_url')
        .eq('role', 'alumni')
        .neq('status', 'archived')
        .order('last_name', { ascending: true });

      if (error) throw error;

      const { data: careerData } = await supabase
        .from('alumni_profiles')
        .select('id, location, current_position, current_company, employment_status, headline, about, skills, linkedin_url, portfolio_url, phone');

      const careerMap = new Map((careerData || []).map(c => [c.id, c]));

      return (profilesData || []).map(p => ({
        ...p,
        ...(careerMap.get(p.id) || {}),
      }));
    }),
    staleTime: 60_000, // Directory data is more stable, cache for 1 minute
  });
}

/** Fetch user's alumni profile (career info) */
export function useAlumniProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['alumni_profile', userId],
    queryFn: () => executeWithTokenRefresh(async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('alumni_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    }),
    enabled: !!userId,
  });
}

/** Fetch user connections (who they follow) */
export function useConnections(userId: string | undefined) {
  return useQuery({
    queryKey: ['connections', userId],
    queryFn: () => executeWithTokenRefresh(async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('alumni_connections')
        .select('following_id')
        .eq('follower_id', userId);
      return new Set((data || []).map(d => d.following_id));
    }),
    enabled: !!userId,
  });
}

/** Fetch user's job applications */
export function useMyApplications(userId: string | undefined) {
  return useQuery({
    queryKey: ['job_applications', userId],
    queryFn: () => executeWithTokenRefresh(async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, jobs(*)')
        .eq('alumni_id', userId)
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }),
    enabled: !!userId,
  });
}

/** Fetch applied job IDs for the current user */
export function useAppliedJobIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['applied_job_ids', userId],
    queryFn: () => executeWithTokenRefresh(async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('alumni_id', userId);
      return new Set((data || []).map(a => a.job_id));
    }),
    enabled: !!userId,
  });
}

/** Fetch upcoming events for dashboard widget — falls back to recent events if none upcoming */
export function useUpcomingEvents(limit = 3) {
  return useQuery({
    queryKey: ['upcoming_events', limit],
    queryFn: () => executeWithTokenRefresh(async () => {
      // First try future events
      const { data: upcoming, error } = await supabase
        .from('alumni_events')
        .select('*')
        .eq('status', 'active')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(limit);
      if (error) throw error;
      if (upcoming && upcoming.length > 0) return upcoming;

      // Fallback: fetch most recent events (last 90 days)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 90);
      const { data: recent, error: err2 } = await supabase
        .from('alumni_events')
        .select('*')
        .eq('status', 'active')
        .gte('date', pastDate.toISOString())
        .order('date', { ascending: false })
        .limit(limit);
      if (err2) throw err2;
      return recent ?? [];
    }),
  });
}

/** Fetch a single featured event */
export function useFeaturedEvent() {
  return useQuery({
    queryKey: ['featured_event'],
    queryFn: () => executeWithTokenRefresh(async () => {
      const { data, error } = await supabase
        .from('alumni_events')
        .select('*')
        .eq('is_featured', true)
        .or('status.eq.active,status.eq.approved')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }),
  });
}

/** Fetch saved job IDs for the current user */
export function useSavedJobIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['saved_job_ids', userId],
    queryFn: () => executeWithTokenRefresh(async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('alumni_saved_jobs')
        .select('job_id')
        .eq('alumni_id', userId);
      return new Set((data || []).map(s => s.job_id));
    }),
    enabled: !!userId,
  });
}

/** Fetch Audit Logs with profile names */
export function useAuditLogs(filters: { action?: string; search?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['audit_logs', filters],
    queryFn: () => executeWithTokenRefresh(async () => {
      let query = supabase
        .from('audit_logs')
        .select('id, user_id, action, details, ip_address, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters.action && filters.action !== 'all') query = query.eq('action', filters.action);
      if (filters.search) {
        query = query.or(`action.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%`);
      }
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set((data || []).map(l => l.user_id))].filter(Boolean);
      let profileMap = new Map();

      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);
        profileMap = new Map((profileData || []).map(p => [p.id, p]));
      }

      return (data || []).map(l => ({
        ...l,
        profiles: l.user_id ? profileMap.get(l.user_id) : undefined
      }));
    }),
    staleTime: 10_000, // Audit logs updated frequently
  });
}

/** Fetch Admin Dashboard Stats in parallel */
export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin_dashboard_stats'],
    queryFn: () => executeWithTokenRefresh(async () => {
      // 1. Attempt fast single-call RPC
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_dashboard_stats');
        if (!rpcError && rpcData) {
          return rpcData as {
            stats: {
              total: number;
              unclaimed: number;
              verified: number;
              rejected: number;
              pending: number;
              pendingApplications: number;
            };
            modules: { events: number; jobs: number; campaigns: number; news: number };
          };
        }
      } catch {
        /* Fallback to table queries below if RPC is not yet applied */
      }

      // 2. Fallback to batched count queries if RPC is not available
      const [
        { count: total },
        { count: unclaimed },
        { count: verified },
        { count: rejected },
        pendingApprovalRes,
        pendingAppsRes,
        { count: events },
        { count: jobs },
        { count: campaigns },
        { count: news },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni').eq('status', 'master_list'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni').eq('status', 'verified'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni').eq('status', 'rejected'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni').eq('status', 'pending_approval'),
        supabase.from('subscription_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('alumni_events').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('donation_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('news_articles').select('*', { count: 'exact', head: true }).eq('is_published', true),
      ]);

      const pendingCount = (pendingApprovalRes?.count || 0) + (pendingAppsRes?.count || 0);

      return {
        stats: { 
          total: total || 0, 
          unclaimed: unclaimed || 0, 
          verified: verified || 0, 
          rejected: rejected || 0,
          pending: pendingApprovalRes?.count || 0,
          pendingApplications: pendingCount
        },
        modules: { events: events || 0, jobs: jobs || 0, campaigns: campaigns || 0, news: news || 0 }
      };
    }),
    staleTime: 60_000,
    refetchInterval: false,
  });
}
