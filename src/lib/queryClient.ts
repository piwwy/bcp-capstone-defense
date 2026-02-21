import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 30 seconds — no refetch if navigating back within 30s
      staleTime: 30_000,
      // Cache stays in memory for 5 minutes even after component unmounts
      gcTime: 5 * 60 * 1000,
      // Always refresh data when route/module remounts
      refetchOnMount: 'always',
      // Auto-refetch when user returns to tab (keeps data fresh)
      refetchOnWindowFocus: true,
      // Don't retry failed queries aggressively
      retry: 1,
    },
  },
});
