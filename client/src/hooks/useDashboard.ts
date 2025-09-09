import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardDTO } from "../../../shared/schema";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async (): Promise<DashboardDTO> => {
      const response = await apiRequest('GET', '/api/dashboard/metrics');
      return response;
    },
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}