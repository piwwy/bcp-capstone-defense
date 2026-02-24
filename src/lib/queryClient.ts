import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 30 seconds — no refetch if navigating back within 30s
      staleTime: 30_000,
      // Keep cache alive for 1 hour to support long panel demos without manual refresh
      gcTime: 60 * 60 * 1000,
      // Always refresh data when route/module remounts
      refetchOnMount: 'always',
      // Auto-refetch when user returns to tab (keeps data fresh)
      refetchOnWindowFocus: true,
      // Keep data updated even while user is idle on another tab
      refetchInterval: 60_000,
      refetchIntervalInBackground: true,
      // Don't retry failed queries aggressively
      retry: 1,
    },
  },
});
