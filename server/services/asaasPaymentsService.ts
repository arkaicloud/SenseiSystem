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
  // NOVO: Pagamentos em atraso (pagos após vencimento)
  latePaymentsCount: number;
  latePaymentsValue: number;
}

// Define AsaasPaymentWithCustomer to include customer data, though it's not strictly used in the modified calculateMetrics
interface AsaasPaymentWithCustomer extends AsaasPayment {
  customerData?: AsaasCustomer;
}


export class AsaasPaymentsService {
  private apiKey: string;
  private baseUrl: string;
  private isConfigured: boolean;

  constructor(apiKey?: string, useSandbox?: boolean) {
    // Priority: provided apiKey > environment variable > empty
    this.apiKey = apiKey || process.env.ASAAS_API_KEY || '';
    
    // Auto-detect environment based on API key pattern if useSandbox not specified
    const isTestKey = this.apiKey.includes('_test_') || this.apiKey.startsWith('$aact_');
    const shouldUseSandbox = useSandbox !== undefined ? useSandbox : isTestKey;
    
    this.baseUrl = shouldUseSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
    this.isConfigured = !!this.apiKey;

    if (!this.isConfigured) {
      console.warn('⚠️ ASAAS_API_KEY not found - using mock data for financial features');
    } else {
      const environment = shouldUseSandbox ? 'sandbox' : 'production';
      console.log(`✅ ASAAS PaymentsService initialized (${environment}) with URL:`, this.baseUrl);
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

    // Overdue payments - CORRIGIDO: inclui status OVERDUE também
    const overduePayments = payments.filter(p =>
      (p.status === 'PENDING' || p.status === 'OVERDUE') &&
      new Date(p.dueDate) < now
    );
    const overdueCount = overduePayments.length;

    // Default rate calculation
    const totalReceived = payments.filter(p => p.status === 'RECEIVED').reduce((sum, p) => sum + p.value, 0);
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.value, 0);
    const defaultRate = (totalReceived + totalOverdue) > 0
      ? (totalOverdue / (totalReceived + totalOverdue)) * 100
      : 0;

    // Pagamentos em atraso (pagos após o vencimento) - NOVA FUNCIONALIDADE
    const latePayments = payments.filter(p => 
      p.status === 'RECEIVED' && 
      p.paymentDate && 
      p.dueDate &&
      new Date(p.paymentDate) > new Date(p.dueDate)
    );
    const latePaymentsCount = latePayments.length;
    const latePaymentsValue = latePayments.reduce((sum, p) => sum + p.value, 0);

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

    // Debug para verificar dados vencidos - ENHANCED
    console.log(`📊 Metrics Debug:`);
    console.log(`   - Current date: ${now.toISOString()}`);
    console.log(`   - Total payments: ${payments.length}`);
    console.log(`   - Overdue count: ${overdueCount}`);
    console.log(`   - Overdue value: R$ ${totalOverdue.toFixed(2)}`);
    console.log(`   - Late payments count: ${latePaymentsCount}`);
    console.log(`   - Late payments value: R$ ${latePaymentsValue.toFixed(2)}`);
    
    // Debug status distribution
    const statusCounts = payments.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`   - Status distribution:`, statusCounts);
    
    // Debug payments with dates around 04/09/2025
    const suspiciousPayments = payments.filter(p => 
      p.dueDate && p.dueDate.includes('2025-09-04')
    );
    if (suspiciousPayments.length > 0) {
      console.log(`   🔍 Payments with dueDate 2025-09-04:`);
      suspiciousPayments.forEach((p, i) => {
        const dueDate = new Date(p.dueDate);
        const isOverdueByDate = dueDate < now;
        console.log(`      ${i+1}. Status: ${p.status} | Due: ${p.dueDate} | isOverdue: ${isOverdueByDate} | Value: R$ ${p.value}`);
      });
    }
    
    if (overduePayments.length > 0) {
      console.log(`   🔴 Overdue payments details:`);
      overduePayments.forEach((p, i) => {
        console.log(`      ${i+1}. Status: ${p.status} | Due: ${p.dueDate} | Value: R$ ${p.value}`);
      });
    }

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
      payingStudentsCount,
      // NOVAS MÉTRICAS para pagamentos em atraso
      latePaymentsCount,
      latePaymentsValue
    };
  }
}