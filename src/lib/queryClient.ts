import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 1 minute — prevents duplicate fetches when switching views
      staleTime: 60_000,
      // Retain inactive queries in garbage collection cache for 15 minutes
      gcTime: 15 * 60 * 1000,
      // Do not refetch on mount if data is already fresh in cache
      refetchOnMount: false,
      // Do not aggressively refetch when returning focus to window (prevents network bursts)
      refetchOnWindowFocus: false,
      // Completely disable background polling by default — stops database hammering on idle tabs
      refetchInterval: false,
      refetchIntervalInBackground: false,
      // Single retry for failed queries
      retry: 1,
    },
  },
});
