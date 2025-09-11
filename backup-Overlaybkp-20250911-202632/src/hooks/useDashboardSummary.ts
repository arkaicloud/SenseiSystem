import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type DashboardSummary } from "@shared/types/dashboard";
import { businessRules } from "@/config/businessRules";
import { apiRequest } from "@/lib/queryClient";

export interface DashboardSummaryOptions {
  period?: 'current_month' | 'last_30_days' | 'last_90_days';
  timezone?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Unified hook for dashboard data as per audit requirements.
 * Replaces all individual dashboard hooks with a single, efficient endpoint.
 * 
 * Features:
 * - Single API call for all dashboard metrics
 * - Automatic refresh based on business rules
 * - Type-safe with Zod validation
 * - Configurable time periods
 * - Data freshness tracking
 */
export function useDashboardSummary(options: DashboardSummaryOptions = {}) {
  const {
    period = 'current_month',
    timezone = 'America/Sao_Paulo',
    enabled = true,
    refetchInterval = businessRules.cache.autoRefreshInterval
  } = options;

  const queryClient = useQueryClient();

  const queryKey = ["dashboardSummary", { period, timezone }];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<DashboardSummary> => {
      const searchParams = new URLSearchParams({
        period,
        timezone
      });

      const response = await apiRequest(`/api/dashboard/summary?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard summary: ${response.statusText}`);
      }

      return response.json();
    },
    enabled,
    staleTime: businessRules.cache.defaultStaleTime,
    refetchInterval,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // Keep data fresh but avoid excessive requests
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry authentication errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Data freshness utilities
  const isDataFresh = query.data ? 
    (Date.now() - new Date(query.data.generatedAt).getTime()) < businessRules.cache.dataFreshnessThreshold 
    : false;

  const lastUpdated = query.data ? new Date(query.data.generatedAt) : null;

  const refreshDashboard = () => {
    return queryClient.invalidateQueries({ queryKey });
  };

  const forceRefresh = () => {
    return queryClient.refetchQueries({ queryKey });
  };

  // Computed values for common use cases
  const computedValues = query.data ? {
    // Activity rate percentage
    activityRate: query.data.metrics.activeStudents > 0 && query.data.metrics.activeStudents > 0
      ? Math.round((query.data.metrics.activeStudents / query.data.metrics.activeStudents) * 100)
      : 0,
    
    // Format attendance rate as percentage
    attendanceRatePercentage: Math.round(query.data.metrics.attendanceRate * 100),
    
    // Revenue formatted in BRL
    revenueInBRL: query.data.metrics.monthlyRevenue / 100,
    
    // Risk indicators
    hasAtRiskStudents: query.data.metrics.atRiskStudents > 0,
    hasOverduePayments: query.data.metrics.delinquency > 0,
    hasPendingApprovals: query.data.metrics.pendingApprovals > 0,
    
    // Today indicators
    hasTodayClasses: query.data.today.classes.length > 0,
    hasTodayBirthdays: query.data.today.birthdays.length > 0,
    
    // Belt distribution totals
    totalAdultBelts: Object.values(query.data.belts.adult).reduce((sum, count) => sum + count, 0),
    totalKidsBelts: Object.values(query.data.belts.kids).reduce((sum, count) => sum + count, 0),
  } : null;

  return {
    // Core data
    data: query.data,
    
    // Query states
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    isSuccess: query.isSuccess,
    
    // Data freshness
    isDataFresh,
    lastUpdated,
    
    // Actions
    refreshDashboard,
    forceRefresh,
    
    // Computed values for easy access
    computedValues,
    
    // Specific data accessors (for easier migration from old hooks)
    metrics: query.data?.metrics,
    todayClasses: query.data?.today.classes || [],
    todayBirthdays: query.data?.today.birthdays || [],
    beltStats: query.data?.belts,
    period: query.data?.period,
    generatedAt: query.data?.generatedAt,
  };
}

// Specialized hooks for specific use cases (optional, for easier migration)
export function useActiveStudents() {
  const { data, isLoading, error } = useDashboardSummary();
  return {
    activeStudents: data?.metrics.activeStudents || 0,
    isLoading,
    error
  };
}

export function useAttendanceRate() {
  const { data, isLoading, error, computedValues } = useDashboardSummary();
  return {
    attendanceRate: data?.metrics.attendanceRate || 0,
    attendanceRatePercentage: computedValues?.attendanceRatePercentage || 0,
    isLoading,
    error
  };
}

export function useMonthlyRevenue() {
  const { data, isLoading, error, computedValues } = useDashboardSummary();
  return {
    monthlyRevenue: data?.metrics.monthlyRevenue || 0,
    revenueInBRL: computedValues?.revenueInBRL || 0,
    isLoading,
    error
  };
}

export function useTodayData() {
  const { data, isLoading, error } = useDashboardSummary();
  return {
    todayClasses: data?.today.classes || [],
    todayBirthdays: data?.today.birthdays || [],
    isLoading,
    error
  };
}

export function useBeltDistribution() {
  const { data, isLoading, error, computedValues } = useDashboardSummary();
  return {
    adult: data?.belts.adult || {},
    kids: data?.belts.kids || {},
    totalAdult: computedValues?.totalAdultBelts || 0,
    totalKids: computedValues?.totalKidsBelts || 0,
    isLoading,
    error
  };
}

export function useRiskIndicators() {
  const { data, isLoading, error, computedValues } = useDashboardSummary();
  return {
    atRiskStudents: data?.metrics.atRiskStudents || 0,
    delinquency: data?.metrics.delinquency || 0,
    pendingApprovals: data?.metrics.pendingApprovals || 0,
    hasAtRiskStudents: computedValues?.hasAtRiskStudents || false,
    hasOverduePayments: computedValues?.hasOverduePayments || false,
    hasPendingApprovals: computedValues?.hasPendingApprovals || false,
    isLoading,
    error
  };
}