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

interface FinancialMetrics {
  receivedThisMonth: number;
  pendingValue: number;
  overdueCount: number;
  defaultRate: number;
  totalPaymentsThisMonth: number;
  nextDueDate: Date | null;
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  averageTicket: number;
  revenueVariation: number;
  previousMonthRevenue: number;
  payingStudentsCount: number;
}

// Define AsaasPaymentWithCustomer to include customer data, though it's not strictly used in the modified calculateMetrics
interface AsaasPaymentWithCustomer extends AsaasPayment {
  customerData?: AsaasCustomer;
}


export class AsaasPaymentsService {
  private apiKey: string;
  private baseUrl: string;
  private isConfigured: boolean;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.baseUrl = 'https://sandbox.asaas.com/api/v3';
    this.isConfigured = !!this.apiKey;

    if (!this.isConfigured) {
      console.warn('⚠️ ASAAS_API_KEY not found - using mock data for financial features');
    } else {
      console.log('✅ ASAAS Service initialized successfully');
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
    if (!this.isConfigured) {
      console.log('⚠️ ASAAS not configured, returning mock data');
      return this.getMockPayments();
    }

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
      console.log('⚠️ Falling back to mock data');
      return this.getMockPayments();
    }
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    if (!this.isConfigured) {
      console.log('⚠️ ASAAS not configured, returning mock customer');
      return {
        id: customerId,
        name: 'Cliente Mock',
        email: 'mock@example.com',
        phone: '(00) 00000-0000',
        cpfCnpj: '000.000.000-00'
      };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/customers/${customerId}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching customer ${customerId}:`, error.response?.data || error.message);
      // Return mock instead of throwing
      return {
        id: customerId,
        name: 'Cliente Mock',
        email: 'mock@example.com',
        phone: '(00) 00000-0000',
        cpfCnpj: '000.000.000-00'
      };
    }
  }

  private getMockPayments(): AsaasPaymentsResponse {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    return {
      object: 'list',
      hasMore: false,
      totalCount: 3,
      limit: 100,
      offset: 0,
      data: [
        {
          id: 'mock_1',
          customer: 'cus_mock_1',
          value: 150.00,
          status: 'RECEIVED',
          dueDate: lastMonth.toISOString().split('T')[0],
          description: 'Mensalidade - Mock Data',
          dateCreated: lastMonth.toISOString(),
          originalDueDate: lastMonth.toISOString().split('T')[0],
          paymentDate: lastMonth.toISOString(),
          clientPaymentDate: lastMonth.toISOString()
        },
        {
          id: 'mock_2',
          customer: 'cus_mock_2',
          value: 200.00,
          status: 'PENDING',
          dueDate: today.toISOString().split('T')[0],
          description: 'Mensalidade - Mock Data',
          dateCreated: today.toISOString(),
          originalDueDate: today.toISOString().split('T')[0]
        },
        {
          id: 'mock_3',
          customer: 'cus_mock_3',
          value: 150.00,
          status: 'OVERDUE',
          dueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Mensalidade - Mock Data',
          dateCreated: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          originalDueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ]
    };
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

  calculateMetrics(payments: AsaasPaymentWithCustomer[]): FinancialMetrics {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Previous month dates
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Received this month
    const receivedThisMonth = payments
      .filter(p => p.status === 'RECEIVED' &&
        p.paymentDate &&
        new Date(p.paymentDate) >= startOfMonth &&
        new Date(p.paymentDate) <= endOfMonth)
      .reduce((sum, p) => sum + p.value, 0);

    // Received previous month
    const previousMonthRevenue = payments
      .filter(p => p.status === 'RECEIVED' &&
        p.paymentDate &&
        new Date(p.paymentDate) >= startOfPreviousMonth &&
        new Date(p.paymentDate) <= endOfPreviousMonth)
      .reduce((sum, p) => sum + p.value, 0);

    // Count of paying students this month (unique customers)
    const payingCustomersThisMonth = new Set(
      payments
        .filter(p => p.status === 'RECEIVED' &&
          p.paymentDate &&
          new Date(p.paymentDate) >= startOfMonth &&
          new Date(p.paymentDate) <= endOfMonth)
        .map(p => p.customer)
    );
    const payingStudentsCount = payingCustomersThisMonth.size;

    // Calculate ticket médio
    const averageTicket = payingStudentsCount > 0 ? receivedThisMonth / payingStudentsCount : 0;

    // Calculate variação de receita
    const revenueVariation = previousMonthRevenue > 0
      ? ((receivedThisMonth - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;

    // Pending payments (not received, not overdue)
    const pendingPayments = payments.filter(p =>
      p.status === 'PENDING' &&
      new Date(p.dueDate) >= now
    );
    const pendingValue = pendingPayments.reduce((sum, p) => sum + p.value, 0);

    // Overdue payments
    const overduePayments = payments.filter(p =>
      p.status === 'PENDING' &&
      new Date(p.dueDate) < now
    );
    const overdueCount = overduePayments.length;

    // Default rate calculation
    const totalReceived = payments.filter(p => p.status === 'RECEIVED').reduce((sum, p) => sum + p.value, 0);
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.value, 0);
    const defaultRate = (totalReceived + totalOverdue) > 0
      ? (totalOverdue / (totalReceived + totalOverdue)) * 100
      : 0;

    // Payments this month (all statuses)
    const totalPaymentsThisMonth = payments.filter(p => {
      const paymentDate = new Date(p.dateCreated);
      return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
    }).length;

    // Next due date
    const upcomingPayments = payments
      .filter(p => p.status === 'PENDING' && new Date(p.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const nextDueDate = upcomingPayments.length > 0 ? new Date(upcomingPayments[0].dueDate) : null;

    return {
      receivedThisMonth,
      pendingValue,
      overdueCount,
      defaultRate,
      totalPaymentsThisMonth,
      nextDueDate,
      totalReceived,
      totalPending: pendingValue,
      totalOverdue: overduePayments.reduce((sum, p) => sum + p.value, 0),
      averageTicket,
      revenueVariation,
      previousMonthRevenue,
      payingStudentsCount
    };
  }
}