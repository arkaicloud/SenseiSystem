import { z } from "zod";

// Dashboard Summary Types based on audit requirements
export const dashboardPeriodSchema = z.object({
  type: z.enum(['month', 'quarter', 'year', 'custom']),
  from: z.string(), // ISO date string
  to: z.string()    // ISO date string
});

export const dashboardMetricsSchema = z.object({
  activeStudents: z.number(),
  classesHeld: z.number(),
  attendanceRate: z.number(), // 0.0 to 1.0
  monthlyRevenue: z.number(), // in cents
  atRiskStudents: z.number(),
  delinquency: z.number(), // count of overdue payments
  pendingApprovals: z.number()
});

export const todayDataSchema = z.object({
  classes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    startTime: z.string(),
    duration: z.number(),
    instructor: z.string().nullable(),
    attendeeCount: z.number(),
    maxCapacity: z.number().nullable()
  })),
  birthdays: z.array(z.object({
    id: z.number(),
    name: z.string(),
    age: z.number().nullable(),
    phone: z.string().nullable(),
    beltLevel: z.string()
  }))
});

export const beltStatsSchema = z.object({
  adult: z.record(z.string(), z.number()), // { "white": 5, "blue": 3, ... }
  kids: z.record(z.string(), z.number())   // { "grey_white": 2, "grey": 1, ... }
});

export const dashboardSummarySchema = z.object({
  generatedAt: z.string(), // ISO timestamp
  period: dashboardPeriodSchema,
  metrics: dashboardMetricsSchema,
  today: todayDataSchema,
  belts: beltStatsSchema
});

// TypeScript types
export type DashboardPeriod = z.infer<typeof dashboardPeriodSchema>;
export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;
export type TodayData = z.infer<typeof todayDataSchema>;
export type BeltStats = z.infer<typeof beltStatsSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

// Query parameters for dashboard summary endpoint
export const dashboardSummaryQuerySchema = z.object({
  period: z.enum(['current_month', 'last_30_days', 'last_90_days']).optional().default('current_month'),
  timezone: z.string().optional().default('America/Sao_Paulo')
}).optional();