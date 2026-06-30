import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["dashboard-metrics"] });
  }, []);

  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/metrics', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      return response.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });
}
