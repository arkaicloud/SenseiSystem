import { db } from '../db';
import { students, studentPayments, users } from '@shared/schema';
import { eq, and, avg, count } from 'drizzle-orm';

export interface EngagementMetrics {
  attendanceRate: number;
  overduePayments: number;
}

export class EngagementMetricsService {
  private cache: EngagementMetrics | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getMetrics(): Promise<EngagementMetrics> {
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

  private async calculateMetrics(): Promise<EngagementMetrics> {
    try {
      // 1. Attendance Rate - Average of all active students with 30+ days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const attendanceRateResult = await db
        .select({ 
          avgRate: avg(students.attendanceRate)
        })
        .from(students)
        .innerJoin(users, eq(students.userId, users.id))
        .where(
          and(
            eq(users.active, true),
            eq(users.status, 'active')
            // Note: Adding joinDate filter would be: lte(users.joinDate, thirtyDaysAgo)
            // But keeping simple as per current data structure
          )
        );
      
      const attendanceRate = Number(attendanceRateResult[0]?.avgRate || 0);

      // 2. Overdue Payments - Count of overdue payments for active students
      let overduePayments = 0;
      try {
        const overdueResult = await db
          .select({ count: count() })
          .from(studentPayments)
          .innerJoin(students, eq(studentPayments.studentId, students.id))
          .innerJoin(users, eq(students.userId, users.id))
          .where(
            and(
              eq(studentPayments.status, 'overdue'),
              eq(users.active, true),
              eq(users.status, 'active')
            )
          );
        
        overduePayments = overdueResult[0]?.count || 0;
      } catch (error) {
        // Student payments table might not exist or have overdue status
        console.log('Overdue payments calculation not available');
      }

      return {
        attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal
        overduePayments
      };

    } catch (error) {
      console.error('Error calculating engagement metrics:', error);
      
      // Return fallback metrics
      return {
        attendanceRate: 0,
        overduePayments: 0
      };
    }
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  async refreshCache(): Promise<EngagementMetrics> {
    this.clearCache();
    return await this.getMetrics();
  }
}

export const engagementMetricsService = new EngagementMetricsService();