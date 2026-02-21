import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

// ============================================================
// Reusable hooks for common Supabase queries
// Uses TanStack Query for caching, deduplication, background refetch
// ============================================================

/** Fetch active jobs (cached, shared across pages) */
export function useJobs(limit?: number) {
  return useQuery({
    queryKey: ['jobs', 'active', limit],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetch active events with attendees */
export function useEvents() {
  return useQuery({
    queryKey: ['alumni_events', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alumni_events')
        .select('*, event_attendees ( alumni_id )')
        .eq('status', 'active')
        .order('date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetch active donation campaigns */
export function useCampaigns(limit?: number) {
  return useQuery({
    queryKey: ['donation_campaigns', 'active', limit],
    queryFn: async () => {
      let query = supabase
        .from('donation_campaigns')
        .select('*')
        .eq('status', 'active');
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetch published news articles with author info */
export function useNewsArticles() {
  return useQuery({
    queryKey: ['news_articles', 'published'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*, profiles:author_id(first_name, last_name)')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetch alumni directory (profiles + career data merged) */
export function useAlumniDirectory() {
  return useQuery({
    queryKey: ['alumni_directory'],
    queryFn: async () => {
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
    },
    staleTime: 60_000, // Directory data is more stable, cache for 1 minute
  });
}

/** Fetch user's alumni profile (career info) */
export function useAlumniProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['alumni_profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('alumni_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    },
    enabled: !!userId,
  });
}

/** Fetch user connections (who they follow) */
export function useConnections(userId: string | undefined) {
  return useQuery({
    queryKey: ['connections', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('alumni_connections')
        .select('following_id')
        .eq('follower_id', userId);
      return new Set((data || []).map(d => d.following_id));
    },
    enabled: !!userId,
  });
}

/** Fetch user's job applications */
export function useMyApplications(userId: string | undefined) {
  return useQuery({
    queryKey: ['job_applications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, jobs(*)')
        .eq('alumni_id', userId)
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

/** Fetch applied job IDs for the current user */
export function useAppliedJobIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['applied_job_ids', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('alumni_id', userId);
      return new Set((data || []).map(a => a.job_id));
    },
    enabled: !!userId,
  });
}

/** Fetch upcoming events for dashboard widget — falls back to recent events if none upcoming */
export function useUpcomingEvents(limit = 3) {
  return useQuery({
    queryKey: ['upcoming_events', limit],
    queryFn: async () => {
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
    },
  });
}

/** Fetch a single featured event */
export function useFeaturedEvent() {
  return useQuery({
    queryKey: ['featured_event'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alumni_events')
        .select('*')
        .eq('is_featured', true)
        .or('status.eq.active,status.eq.approved') // checking both valid "live" statuses just in case
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

/** Fetch saved job IDs for the current user */
export function useSavedJobIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['saved_job_ids', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('alumni_saved_jobs')
        .select('job_id')
        .eq('alumni_id', userId);
      return new Set((data || []).map(s => s.job_id));
    },
    enabled: !!userId,
  });
}
