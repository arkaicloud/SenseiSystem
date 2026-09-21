import axios from 'axios';
import { calendarDateKey, calendarDateKeyInTimeZone, parseCalendarDateAsLocal, shiftCalendarDateKey } from '@shared/calendarDates';

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
  installment?: string; // installment plan ID (present when payment is part of a parcelamento)
  externalReference?: string;
  billingType?: string;
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
    
    // If apiKey is provided (from school config), default to production unless explicitly sandbox
    const shouldUseSandbox = apiKey ? (useSandbox === true) : (useSandbox !== undefined ? useSandbox : isTestKey);
    
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

  /**
   * Cancels a single standalone payment (not part of an installment plan).
   * Use cancelInstallmentPayments() for parcelamento payments.
   */
  async cancelPayment(paymentId: string): Promise<{ id: string; status: string; deleted: boolean }> {
    if (!this.isConfigured) {
      throw new Error('ASAAS não configurado. Configure a chave de API nas configurações da escola.');
    }
    try {
      console.log(`🗑️ Cancelling ASAAS payment ${paymentId}...`);
      const response = await axios.delete(`${this.baseUrl}/payments/${paymentId}`, {
        headers: this.getHeaders(),
        timeout: 60000,
      });
      console.log(`✅ ASAAS payment ${paymentId} cancelled`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error cancelling ASAAS payment ${paymentId}:`, error.response?.data || error.message);
      throw new Error(`Erro ao cancelar cobrança: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Cancels all pending/overdue payments of an installment plan.
   * Required when the payment has an `installment` field (parcelamento).
   * ASAAS endpoint: DELETE /installments/{id}/payments
   */
  async cancelInstallmentPayments(installmentId: string): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('ASAAS não configurado. Configure a chave de API nas configurações da escola.');
    }
    try {
      console.log(`🗑️ Cancelling all pending payments of installment ${installmentId}...`);
      await axios.delete(`${this.baseUrl}/installments/${installmentId}/payments`, {
        headers: this.getHeaders(),
        timeout: 60000,
      });
      console.log(`✅ Installment ${installmentId} payments cancelled`);
    } catch (error: any) {
      console.error(`❌ Error cancelling installment ${installmentId}:`, error.response?.data || error.message);
      throw new Error(`Erro ao cancelar parcelamento: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Smart cancel: detects if the payment is part of an installment and
   * calls the correct endpoint automatically.
   */
  async smartCancelPayment(paymentId: string, installmentId?: string): Promise<{ method: string }> {
    if (installmentId) {
      await this.cancelInstallmentPayments(installmentId);
      return { method: 'installment' };
    }
    await this.cancelPayment(paymentId);
    return { method: 'single' };
  }

  /**
   * Lists all charges generated by a specific subscription.
   * Uses the documented endpoint: GET /v3/subscriptions/{id}/payments
   * This correctly returns the full historical billing of a subscription.
   */
  async getSubscriptionPayments(subscriptionId: string): Promise<AsaasPayment[]> {
    if (!this.isConfigured) throw new Error('ASAAS não configurado.');
    const all: AsaasPayment[] = [];
    let offset = 0;
    const PAGE = 100;
    while (true) {
      try {
        const res = await axios.get(`${this.baseUrl}/subscriptions/${subscriptionId}/payments`, {
          headers: this.getHeaders(),
          params: { limit: PAGE, offset },
        });
        const data: AsaasPayment[] = res.data.data || [];
        all.push(...data);
        if (!res.data.hasMore || data.length < PAGE) break;
        offset += PAGE;
      } catch (err: any) {
        // 404 = subscription not found / deleted; just return empty
        if (err.response?.status === 404) break;
        throw err;
      }
    }
    return all;
  }

  /**
   * Fetches all standalone payments (not linked to a subscription) via GET /v3/payments.
   * Used to capture manual/one-off payments created directly in ASAAS.
   */
  async getAllStandalonePayments(): Promise<AsaasPayment[]> {
    if (!this.isConfigured) throw new Error('ASAAS não configurado.');
    const all: AsaasPayment[] = [];
    let offset = 0;
    const PAGE = 100;
    while (all.length < 5000) {
      const page = await this.getPayments(PAGE, offset);
      const batch = page.data || [];
      all.push(...batch);
      if (!page.hasMore || batch.length < PAGE) break;
      offset += PAGE;
    }
    return all;
  }

  async getPayments(limit: number = 100, offset: number = 0, dueDateGe?: string, dueDateLe?: string): Promise<AsaasPaymentsResponse> {
    if (!this.isConfigured) {
      throw new Error('ASAAS não configurado. Configure a chave de API nas configurações da escola.');
    }

    try {
      console.log('🔄 Fetching ASAAS payments...');

      const params: Record<string, any> = { limit, offset, order: 'desc' };
      if (dueDateGe) params.dueDateGe = dueDateGe;
      if (dueDateLe) params.dueDateLe = dueDateLe;

      const response = await axios.get(`${this.baseUrl}/payments`, {
        headers: this.getHeaders(),
        params,
      });

      console.log(`✅ ASAAS payments fetched: ${response.data.data?.length || 0} payments`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching ASAAS payments:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar pagamentos do ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    if (!this.isConfigured) {
      throw new Error('ASAAS não configurado. Configure a chave de API nas configurações da escola.');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/customers/${customerId}`, {
        headers: this.getHeaders(),
      });

      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching customer ${customerId}:`, error.response?.data || error.message);
      throw new Error(`Erro ao buscar cliente ${customerId}: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  // Fetch payments directly filtered by customer ID (avoids fetching all payments)
  async getPaymentsByCustomerId(customerId: string, statuses: string[] = ['PENDING', 'OVERDUE']): Promise<AsaasPayment[]> {
    if (!this.isConfigured) {
      throw new Error('ASAAS não configurado.');
    }

    const allPayments: AsaasPayment[] = [];
    for (const status of statuses) {
      try {
        let offset = 0;
        while (true) {
          const response = await axios.get(`${this.baseUrl}/payments`, {
            headers: this.getHeaders(),
            params: { customer: customerId, status, limit: 100, offset },
            timeout: 30000,
          });
          const data: AsaasPayment[] = response.data?.data || [];
          allPayments.push(...data);
          if (data.length < 100) break;
          offset += 100;
        }
      } catch (error: any) {
        console.warn(`⚠️ Could not fetch ${status} payments for customer ${customerId}:`, error.response?.data || error.message);
      }
    }
    return allPayments;
  }

  // Find customer by CPF in ASAAS
  async findCustomerByCpf(cpfCnpj: string): Promise<AsaasCustomer | null> {
    if (!this.isConfigured) return null;
    try {
      const clean = cpfCnpj.replace(/\D/g, '');
      const response = await axios.get(`${this.baseUrl}/customers`, {
        headers: this.getHeaders(),
        params: { cpfCnpj: clean, limit: 10 },
        timeout: 15000,
      });
      return response.data?.data?.[0] || null;
    } catch (error: any) {
      console.error('❌ Error finding customer by CPF:', error.response?.data || error.message);
      return null;
    }
  }

  private getMockPayments(): AsaasPaymentsResponse {
    const today = new Date();
    const todayKey = calendarDateKeyInTimeZone(today);
    const lastMonthKey = shiftCalendarDateKey(todayKey, -30);
    
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
          dueDate: lastMonthKey,
          description: 'Mensalidade - Mock Data',
          dateCreated: `${lastMonthKey}T12:00:00.000Z`,
          originalDueDate: lastMonthKey,
          paymentDate: `${lastMonthKey}T12:00:00.000Z`,
          clientPaymentDate: `${lastMonthKey}T12:00:00.000Z`
        },
        {
          id: 'mock_2',
          customer: 'cus_mock_2',
          value: 200.00,
          status: 'PENDING',
          dueDate: todayKey,
          description: 'Mensalidade - Mock Data',
          dateCreated: `${todayKey}T12:00:00.000Z`,
          originalDueDate: todayKey
        },
        {
          id: 'mock_3',
          customer: 'cus_mock_3',
          value: 150.00,
          status: 'OVERDUE',
          dueDate: shiftCalendarDateKey(todayKey, -5),
          description: 'Mensalidade - Mock Data',
          dateCreated: `${shiftCalendarDateKey(todayKey, -5)}T12:00:00.000Z`,
          originalDueDate: shiftCalendarDateKey(todayKey, -5)
        }
      ]
    };
  }

  /**
   * Fetches ALL payments (paginating through ASAAS 100-item pages) within the
   * given date range, then enriches each payment with its customer data.
   * Returns up to MAX_PAYMENTS payments to prevent runaway API calls.
   */
  async getPaymentsWithCustomers(
    _legacyLimit: number = 100,
    dueDateGe?: string,
    dueDateLe?: string
  ): Promise<Array<AsaasPayment & { customerData?: AsaasCustomer }>> {
    const MAX_PAYMENTS = 2000;
    const PAGE_SIZE = 100;

    try {
      // ── 1. Paginate through all ASAAS payment pages ──────────────────────
      const allPayments: AsaasPayment[] = [];
      let offset = 0;

      while (allPayments.length < MAX_PAYMENTS) {
        const page = await this.getPayments(PAGE_SIZE, offset, dueDateGe, dueDateLe);
        const batch = page.data || [];
        allPayments.push(...batch);
        console.log(`📄 ASAAS page offset=${offset}: ${batch.length} payments (total so far: ${allPayments.length}, hasMore: ${page.hasMore})`);
        if (!page.hasMore || batch.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      console.log(`✅ Total ASAAS payments fetched: ${allPayments.length}`);

      // ── 2. Enrich with customer data (batched to avoid ASAAS rate limit) ─
      const customerCache = new Map<string, AsaasCustomer>();
      const CUSTOMER_BATCH = 10; // stay well below ASAAS concurrent limit of 50

      // Collect unique customer IDs and prefetch them in batches
      const uniqueCustomerIds = [...new Set(allPayments.map((p) => p.customer))];
      for (let i = 0; i < uniqueCustomerIds.length; i += CUSTOMER_BATCH) {
        const batch = uniqueCustomerIds.slice(i, i + CUSTOMER_BATCH);
        await Promise.all(
          batch.map(async (customerId) => {
            try {
              const customerData = await this.getCustomer(customerId);
              customerCache.set(customerId, customerData);
            } catch {
              console.warn(`⚠️ Could not fetch customer data for ${customerId}`);
            }
          })
        );
      }

      const paymentsWithCustomers = allPayments.map((payment) => ({
        ...payment,
        customerData: customerCache.get(payment.customer),
      }));

      return paymentsWithCustomers;
    } catch (error) {
      console.error('❌ Error fetching payments with customers:', error);
      throw error;
    }
  }

  calculateMetrics(payments: AsaasPaymentWithCustomer[]): FinancialMetrics {
    const now = new Date();
    const currentMonthKey = calendarDateKeyInTimeZone(now).slice(0, 7);
    const [currentYear, currentMonth] = currentMonthKey.split("-").map(Number);
    const previousMonthDate = new Date(Date.UTC(currentYear, currentMonth - 2, 1));
    const previousMonthKey = `${previousMonthDate.getUTCFullYear()}-${String(previousMonthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    const paymentMonthKey = (value: string) => calendarDateKeyInTimeZone(new Date(value)).slice(0, 7);

    // Received this month
    const receivedThisMonth = payments
      .filter(p => p.status === 'RECEIVED' &&
        p.paymentDate &&
        paymentMonthKey(p.paymentDate) === currentMonthKey)
      .reduce((sum, p) => sum + p.value, 0);

    // Received previous month
    const previousMonthRevenue = payments
      .filter(p => p.status === 'RECEIVED' &&
        p.paymentDate &&
        paymentMonthKey(p.paymentDate) === previousMonthKey)
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
      (calendarDateKey(p.dueDate) || "") >= currentMonthKey + "-01"
    );
    const pendingValue = pendingPayments.reduce((sum, p) => sum + p.value, 0);

    // Overdue payments - CORRIGIDO: inclui status OVERDUE também
    const overduePayments = payments.filter(p =>
      (p.status === 'PENDING' || p.status === 'OVERDUE') &&
      (calendarDateKey(p.dueDate) || "") < calendarDateKeyInTimeZone(now)
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
      calendarDateKeyInTimeZone(new Date(p.paymentDate)) > (calendarDateKey(p.dueDate) || "")
    );
    const latePaymentsCount = latePayments.length;
    const latePaymentsValue = latePayments.reduce((sum, p) => sum + p.value, 0);

    // Payments this month (all statuses)
    const totalPaymentsThisMonth = payments.filter(p => {
      const paymentDate = new Date(p.dateCreated);
      return paymentMonthKey(p.dateCreated) === currentMonthKey;
    }).length;

    // Next due date
    const upcomingPayments = payments
      .filter(p => p.status === 'PENDING' && (calendarDateKey(p.dueDate) || "") >= calendarDateKeyInTimeZone(now))
      .sort((a, b) => (calendarDateKey(a.dueDate) || "").localeCompare(calendarDateKey(b.dueDate) || ""));

    const nextDueDate = upcomingPayments.length > 0 ? parseCalendarDateAsLocal(upcomingPayments[0].dueDate) : null;

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
        const dueDate = calendarDateKey(p.dueDate);
        const isOverdueByDate = !!dueDate && dueDate < calendarDateKeyInTimeZone(now);
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