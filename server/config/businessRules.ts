// Business Rules Configuration for Dashboard Metrics
export const businessRules = {
  // Risk assessment parameters
  risk: {
    // Days without attendance to consider student at risk
    daysWithoutAttendance: 30,
    // Attendance rate threshold below which student is at risk
    attendanceRateThreshold: 0.6, // 60%
    // Days since last payment to consider overdue
    paymentOverdueDays: 7
  },
  
  // Time windows for metrics calculation
  timeWindows: {
    // Current month calculation
    attendanceWindow: 'current_month' as const, // 'current_month' | 'last_30_days' | 'last_90_days'
    revenueWindow: 'current_month' as const,
    // Days to look back for class attendance calculation
    classAttendanceDays: 30
  },
  
  // Data freshness and caching
  cache: {
    // How long dashboard data stays fresh (milliseconds)
    dataFreshnessThreshold: 5 * 60 * 1000, // 5 minutes
    // Default stale time for React Query
    defaultStaleTime: 30 * 1000, // 30 seconds
    // Auto-refresh interval
    autoRefreshInterval: 60 * 1000 // 1 minute
  },
  
  // Student status definitions
  studentStatus: {
    active: 'active' as const,
    inactive: 'inactive' as const,
    suspended: 'suspended' as const
  },
  
  // Payment status definitions
  paymentStatus: {
    paid: 'paid' as const,
    pending: 'pending' as const,
    overdue: 'overdue' as const,
    cancelled: 'cancelled' as const
  }
} as const;

export type BusinessRules = typeof businessRules;