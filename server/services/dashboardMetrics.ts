import { db } from '../db';
import { students, classes, attendance, studentPayments, users } from '@shared/schema';
import { eq, gte, lt, and, sql, count, avg, sum } from 'drizzle-orm';

export interface DashboardMetrics {
  activeStudents: number;
  classesThisMonth: number;
  attendanceRate: number;
  monthlyRevenue: number;
  studentsAtRisk: number;
  overduePayments: number;
  totalStudents: number;
  newStudentsThisMonth: number;
  beltDistribution: { [key: string]: number };
}

export class DashboardMetricsService {
  private cache: DashboardMetrics | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Method to clear cache (useful for testing)
  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  async getMetrics(): Promise<DashboardMetrics> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cache;
    }

    // Calculate fresh metrics
    const metrics = await this.calculateMetrics();
    
    // Update cache
    this.cache = metrics;
    this.cacheTimestamp = now;
    
    return metrics;
  }

  async refreshCache(): Promise<DashboardMetrics> {
    this.clearCache();
    return await this.getMetrics();
  }

  private async calculateMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
      // Active Students
      const activeStudentsResult = await db
        .select({ count: count() })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(eq(users.status, 'active'));
      
      const activeStudents = activeStudentsResult[0]?.count || 0;

      // Total Students
      const totalStudentsResult = await db
        .select({ count: count() })
        .from(students);
      
      const totalStudents = totalStudentsResult[0]?.count || 0;

      // Classes This Month (use total classes as we don't have createdAt field)
      const classesThisMonthResult = await db
        .select({ count: count() })
        .from(classes);
      
      const classesThisMonth = classesThisMonthResult[0]?.count || 0;

      // New Students This Month (use joinDate field)
      const newStudentsResult = await db
        .select({ count: count() })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(
          and(
            gte(users.joinDate, startOfMonth),
            lt(users.joinDate, endOfMonth)
          )
        );
      
      const newStudentsThisMonth = newStudentsResult[0]?.count || 0;

      // Attendance Rate (average of all students' attendance rates)
      const attendanceRateResult = await db
        .select({ 
          avgRate: avg(students.attendanceRate)
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(eq(users.status, 'active'));
      
      const attendanceRate = Number(attendanceRateResult[0]?.avgRate || 0);

      // Students at Risk (attendance rate < 50%)
      const studentsAtRiskResult = await db
        .select({ count: count() })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(
          and(
            eq(users.status, 'active'),
            lt(students.attendanceRate, 50)
          )
        );
      
      const studentsAtRisk = studentsAtRiskResult[0]?.count || 0;

      // Monthly Revenue (from studentPayments table if it exists)
      let monthlyRevenue = 0;
      try {
        const revenueResult = await db
          .select({ 
            total: sum(studentPayments.amount)
          })
          .from(studentPayments)
          .where(
            and(
              gte(studentPayments.paidDate, startOfMonth),
              lt(studentPayments.paidDate, endOfMonth),
              eq(studentPayments.status, 'paid')
            )
          );
        
        monthlyRevenue = Number(revenueResult[0]?.total || 0) / 100; // Convert from cents
      } catch (error) {
        // Student payments table might not exist yet
        console.log('Student payments table not available for revenue calculation');
      }

      // Overdue Payments
      let overduePayments = 0;
      try {
        const overdueResult = await db
          .select({ count: count() })
          .from(studentPayments)
          .where(
            and(
              lt(studentPayments.dueDate, now),
              eq(studentPayments.status, 'pending')
            )
          );
        
        overduePayments = overdueResult[0]?.count || 0;
      } catch (error) {
        // Student payments table might not exist yet
        console.log('Student payments table not available for overdue calculation');
      }

      // Belt Distribution
      const beltDistributionResult = await db
        .select({
          beltLevel: students.beltLevel,
          count: count()
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(eq(users.status, 'active'))
        .groupBy(students.beltLevel);

      const beltDistribution: { [key: string]: number } = {};
      beltDistributionResult.forEach(row => {
        beltDistribution[row.beltLevel] = row.count;
      });

      return {
        activeStudents,
        totalStudents,
        classesThisMonth,
        attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal
        monthlyRevenue,
        studentsAtRisk,
        overduePayments,
        newStudentsThisMonth,
        beltDistribution
      };

    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      
      // Return fallback metrics
      return {
        activeStudents: 0,
        totalStudents: 0,
        classesThisMonth: 0,
        attendanceRate: 0,
        monthlyRevenue: 0,
        studentsAtRisk: 0,
        overduePayments: 0,
        newStudentsThisMonth: 0,
        beltDistribution: {}
      };
    }
  }

  async refreshCache(): Promise<DashboardMetrics> {
    this.clearCache();
    return await this.getMetrics();
  }
}

// Export singleton instance
export const dashboardMetricsService = new DashboardMetricsService();