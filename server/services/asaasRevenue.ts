import { db } from '../db';
import { schoolConfig } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface AsaasRevenue {
  monthlyRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  averageTicket: number;
  revenueVariation: number;
  previousMonthRevenue: number;
  payingStudentsCount: number;
}

export class AsaasRevenueService {
  private cache: AsaasRevenue | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  async getMonthlyRevenue(): Promise<AsaasRevenue> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cache;
    }

    // Calculate fresh revenue data
    const revenue = await this.calculateRevenue();
    
    // Update cache
    this.cache = revenue;
    this.cacheTimestamp = now;
    
    return revenue;
  }

  private async calculateRevenue(): Promise<AsaasRevenue> {
    try {
      // Get school ASAAS configuration
      const [schoolSettings] = await db
        .select({
          asaasApiKey: schoolConfig.asaasApiKey,
          asaasCustomerId: schoolConfig.asaasCustomerId
        })
        .from(schoolConfig)
        .limit(1);

      if (!schoolSettings?.asaasApiKey) {
        console.log('ASAAS API key not configured, using fallback revenue calculation');
        return this.getFallbackRevenue();
      }

      // Calculate current month dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // TODO: Implement ASAAS API integration here
      // For now, return fallback data
      return this.getFallbackRevenue();

    } catch (error) {
      console.error('Error calculating ASAAS revenue:', error);
      return this.getFallbackRevenue();
    }
  }

  private async getFallbackRevenue(): Promise<AsaasRevenue> {
    // Fallback calculation based on student payments table
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Previous month dates
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Calculate from studentPayments table if available
      // This would be replaced with actual ASAAS API calls
      const monthlyRevenue = 0;
      const previousMonthRevenue = 0;
      const payingStudentsCount = 0;
      
      // Calculate ticket médio
      const averageTicket = payingStudentsCount > 0 ? monthlyRevenue / payingStudentsCount : 0;
      
      // Calculate variação de receita
      const revenueVariation = previousMonthRevenue > 0 
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;
      
      return {
        monthlyRevenue,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        averageTicket,
        revenueVariation,
        previousMonthRevenue,
        payingStudentsCount
      };
    } catch (error) {
      console.error('Error in fallback revenue calculation:', error);
      return {
        monthlyRevenue: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        averageTicket: 0,
        revenueVariation: 0,
        previousMonthRevenue: 0,
        payingStudentsCount: 0
      };
    }
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const asaasRevenueService = new AsaasRevenueService();