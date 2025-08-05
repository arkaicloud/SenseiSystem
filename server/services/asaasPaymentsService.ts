import axios from 'axios';

interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  status: 'RECEIVED' | 'PENDING' | 'OVERDUE' | 'CONFIRMED' | 'CANCELLED';
  dueDate: string;
  description: string;
  invoiceUrl?: string;
  paymentLink?: string;
  dateCreated: string;
  originalDueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  installmentCount?: number;
  externalReference?: string;
}

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
}

interface AsaasPaymentsResponse {
  object: 'list';
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasPayment[];
}

export class AsaasPaymentsService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.baseUrl = 'https://sandbox.asaas.com/api/v3';
    
    if (!this.apiKey) {
      throw new Error('ASAAS_API_KEY not found in environment variables');
    }
  }

  private getHeaders() {
    return {
      'User-Agent': 'SenseiSystem/1.0',
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
    };
  }

  async getPayments(limit: number = 100, offset: number = 0): Promise<AsaasPaymentsResponse> {
    try {
      console.log('🔄 Fetching ASAAS payments...');
      
      const response = await axios.get(`${this.baseUrl}/payments`, {
        headers: this.getHeaders(),
        params: {
          limit,
          offset,
          order: 'desc',
        },
      });

      console.log(`✅ ASAAS payments fetched: ${response.data.data?.length || 0} payments`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching ASAAS payments:', error.response?.data || error.message);
      throw new Error(`Failed to fetch payments from ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    try {
      const response = await axios.get(`${this.baseUrl}/customers/${customerId}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching customer ${customerId}:`, error.response?.data || error.message);
      throw new Error(`Failed to fetch customer from ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getPaymentsWithCustomers(limit: number = 100): Promise<Array<AsaasPayment & { customerData?: AsaasCustomer }>> {
    try {
      const paymentsResponse = await this.getPayments(limit);
      const payments = paymentsResponse.data || [];

      // Cache for customers to avoid duplicate requests
      const customerCache = new Map<string, AsaasCustomer>();

      const paymentsWithCustomers = await Promise.all(
        payments.map(async (payment) => {
          try {
            let customerData = customerCache.get(payment.customer);
            
            if (!customerData) {
              customerData = await this.getCustomer(payment.customer);
              customerCache.set(payment.customer, customerData);
            }

            return {
              ...payment,
              customerData,
            };
          } catch (error) {
            console.warn(`⚠️ Could not fetch customer data for ${payment.customer}`);
            return payment;
          }
        })
      );

      return paymentsWithCustomers;
    } catch (error) {
      console.error('❌ Error fetching payments with customers:', error);
      throw error;
    }
  }

  calculateMetrics(payments: AsaasPayment[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter payments for current month
    const currentMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.dateCreated);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    });

    // Calculate metrics
    const receivedPayments = payments.filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED');
    const pendingPayments = payments.filter(p => p.status === 'PENDING');
    const overduePayments = payments.filter(p => p.status === 'OVERDUE');

    const receivedThisMonth = receivedPayments
      .filter(p => {
        const paymentDate = new Date(p.paymentDate || p.clientPaymentDate || p.dateCreated);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + p.value, 0);

    const pendingValue = pendingPayments.reduce((sum, p) => sum + p.value, 0);
    const overdueValue = overduePayments.reduce((sum, p) => sum + p.value, 0);

    const totalPayments = payments.length;
    const overdueCount = overduePayments.length;
    const defaultRate = totalPayments > 0 ? (overdueCount / totalPayments) * 100 : 0;

    // Find next due date
    const futureDueDates = payments
      .filter(p => p.status === 'PENDING' && new Date(p.dueDate) > now)
      .map(p => new Date(p.dueDate))
      .sort((a, b) => a.getTime() - b.getTime());

    const nextDueDate = futureDueDates.length > 0 ? futureDueDates[0] : null;

    return {
      receivedThisMonth,
      pendingValue,
      overdueCount,
      defaultRate,
      totalPaymentsThisMonth: currentMonthPayments.length,
      nextDueDate,
      totalReceived: receivedPayments.reduce((sum, p) => sum + p.value, 0),
      totalPending: pendingValue,
      totalOverdue: overdueValue,
    };
  }
}