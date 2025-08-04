import { db } from '../db';
import { schoolConfig } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface AsaasRevenue {
  monthlyRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
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

      // Calculate from studentPayments table if available
      // This would be replaced with actual ASAAS API calls
      
      return {
        monthlyRevenue: 0, // Will be calculated from ASAAS API
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0
      };
    } catch (error) {
      console.error('Error in fallback revenue calculation:', error);
      return {
        monthlyRevenue: 0,
        paidInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0
      };
    }
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const asaasRevenueService = new AsaasRevenueService();