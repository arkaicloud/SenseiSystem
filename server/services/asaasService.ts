import axios, { AxiosInstance } from 'axios';

type AsaasEnv = "sandbox" | "production";

function inferEnvFromKey(key: string): AsaasEnv | null {
  if (!key) return null;
  const k = key.toLowerCase();
  // Heurísticas comuns para detectar ambiente
  if (k.includes("_hmlg") || k.includes("homolog") || k.includes("sandbox")) return "sandbox";
  return "production";
}

function getBaseUrl(env: AsaasEnv): string {
  return env === "sandbox"
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";
}

// ASAAS API Types - Seguindo ARKAIDEV checklist
export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  observations?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
  notificationDisabled: boolean;
  observations?: string;
}

export interface CreatePaymentRequest {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD' | 'TRANSFER';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  notificationEnabled?: boolean;
}

export interface CreateSubscriptionRequest {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD' | 'TRANSFER';
  value: number;
  nextDueDate: string; // YYYY-MM-DD – first due date
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
  maxPayments?: number; // omit for indefinite
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: string;
  description?: string;
  externalReference?: string;
  dateCreated?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD' | 'TRANSFER';
  status: string;
  value: number;
  netValue?: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  pixCopyAndPaste?: string;
}

/**
 * ASAAS Service - Implementado seguindo documentação oficial
 * URL Sandbox: https://sandbox.asaas.com/api/v3
 * URL Production: https://api.asaas.com/v3
 * Headers: access_token, User-Agent, Content-Type
 */
export class AsaasService {
  private client: AxiosInstance;
  private readonly apiKey: string;
  private readonly isConfigured: boolean;
  private env: AsaasEnv;

  constructor(apiKey?: string) {
    // Priority: provided apiKey > environment variable > school config
    this.apiKey = apiKey || process.env.ASAAS_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error("ASAAS_API_KEY não configurada.");
    }

    const cfgEnv = (process.env.ASAAS_ENV?.toLowerCase() as AsaasEnv) || null;
    const inferred = inferEnvFromKey(this.apiKey);

    // Regra final: valor explícito em ASAAS_ENV vence; se ausente, usa inferência pela chave
    this.env = cfgEnv || inferred || "production";

    // Se houver conflito óbvio, avisa no log
    if (cfgEnv && inferred && cfgEnv !== inferred) {
      console.warn(
        `[ASAAS] Aviso: ASAAS_ENV='${cfgEnv}' e a chave sugere '${inferred}'. Prosseguindo com '${cfgEnv}'.`
      );
    }

    const baseURL = getBaseUrl(this.env);
    this.isConfigured = !!this.apiKey;

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "SenseiSystem/1.0",
        // ASAAS espera este header como 'access_token'
        access_token: this.apiKey,
      },
    });

    console.log(`🔧 ASAAS Service -> env: ${this.env} | baseURL: ${baseURL} | key.len: ${this.apiKey.length}`);
  }

  public getEnvironment(): AsaasEnv {
    return this.env;
  }

  public async testConnection() {
    try {
      // endpoint leve
      const res = await this.client.get("/customers?limit=1");
      return {
        success: true,
        environment: this.env,
        baseURL: this.client.defaults.baseURL,
        total: Array.isArray(res.data?.data) ? res.data.data.length : "unknown",
      };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const friendly =
        status === 401 && data?.errors?.[0]?.code === "invalid_environment"
          ? "A chave de API não corresponde ao ambiente. Verifique se ASAAS_ENV e a chave estão coerentes (sandbox vs production)."
          : err?.message || "Falha ao testar conexão";

      return {
        success: false,
        environment: this.env,
        baseURL: this.client.defaults.baseURL,
        status,
        errors: data?.errors || null,
        message: friendly,
      };
    }
  }

  // Exemplo de uso no sync de clientes
  public async getCustomers(limit = 100) {
    const res = await this.client.get(`/customers?limit=${limit}`);
    return res.data;
  }

  // Legacy methods - keeping for compatibility
  async createCustomer(studentData: any): Promise<AsaasCustomer> {
    if (!this.isConfigured) {
      throw new Error('ASAAS not configured');
    }

    const customerData = {
      name: studentData.responsavel?.nome || studentData.financialResponsibleName || '',
      email: studentData.responsavel?.email || studentData.financialResponsibleEmail || '',
      phone: studentData.responsavel?.telefone || studentData.financialResponsiblePhone || '',
      cpfCnpj: studentData.responsavel?.cpf || studentData.financialResponsibleCpf || '',
      address: studentData.responsavel?.endereco || studentData.street || '',
      addressNumber: studentData.responsavel?.numero || studentData.number || '',
      complement: studentData.responsavel?.complemento || studentData.complement || '',
      province: studentData.responsavel?.cidade || studentData.city || '',
      observations: `Student: ${studentData.first_name} ${studentData.last_name}`
    };

    const response = await this.client.post('/customers', customerData);
    return response.data;
  }

  async findCustomersByCpf(cpfCnpj: string): Promise<AsaasCustomer[]> {
    try {
      const normalizedCpfCnpj = String(cpfCnpj || '').replace(/\D/g, '');
      if (!normalizedCpfCnpj) return [];
      const response = await this.client.get('/customers', {
        params: { cpfCnpj: normalizedCpfCnpj }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error finding customer by CPF:', error);
      return [];
    }
  }

  async findCustomerByCpf(cpfCnpj: string): Promise<AsaasCustomer | null> {
    return (await this.findCustomersByCpf(cpfCnpj))[0] || null;
  }

  async findCustomersByEmail(email: string): Promise<AsaasCustomer[]> {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!normalizedEmail) return [];
      const response = await this.client.get('/customers', {
        params: { email: normalizedEmail }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error finding customer by email:', error);
      return [];
    }
  }

  async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    return (await this.findCustomersByEmail(email))[0] || null;
  }

  async createPaymentForStudent(customerId: string, studentData: any, planData: any): Promise<AsaasPayment> {
    if (!this.isConfigured) {
      throw new Error('ASAAS not configured');
    }

    // Calcular data de vencimento baseada na preferência do aluno
    const today = new Date();
    const preferredDay = Math.min(31, Math.max(1, Number(studentData.preferredDueDate) || 5));
    let targetYear = today.getFullYear();
    let targetMonth = today.getMonth() + 1;
    
    // Se a data preferida já passou no mês atual, usar no próximo mês
    if (planData.frequency === 'monthly') {
      const currentDay = today.getDate();
      if (currentDay >= preferredDay) {
        // Já passou do dia preferido no mês atual, usar próximo mês
        targetMonth = today.getMonth() + 1;
      } else {
        // Ainda não passou, usar no mês atual
        targetMonth = today.getMonth();
      }
    }

    // Para planos anuais, sempre próximo ano
    if (planData.frequency === 'yearly' || planData.frequency === 'annual') {
      targetYear = today.getFullYear() + 1;
    }

    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const dueDate = new Date(targetYear, targetMonth, Math.min(preferredDay, lastDayOfTargetMonth));

    console.log(`📅 Data de vencimento calculada: ${dueDate.toISOString().split('T')[0]} (dia preferido: ${preferredDay})`);

    const paymentData: CreatePaymentRequest = {
      customer: customerId,
      billingType: 'BOLETO',
      value: planData.amount / 100, // Convert cents to reais
      dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
      description: `Mensalidade ${studentData.school_name || 'Academia'} - ${planData.name}`,
      externalReference: `student_${studentData.user_id}_plan_${planData.id}`
    };

    const response = await this.client.post('/payments', paymentData);
    return response.data;
  }

  // Enhanced ASAAS methods for sync functionality
  async getOrCreateAsaasCustomer(studentData: any): Promise<{ customer: AsaasCustomer, created: boolean }> {
    const cpf = studentData.responsavel?.cpf || studentData.financialResponsibleCpf;
    const email = studentData.responsavel?.email || studentData.financialResponsibleEmail;

    if (!cpf && !email) {
      throw new Error('CPF ou e-mail do responsável financeiro é obrigatório');
    }

    // Try to find existing customer first
    let existingCustomer = null;
    if (cpf) {
      existingCustomer = await this.findCustomerByCpf(cpf);
    }
    if (!existingCustomer && email) {
      existingCustomer = await this.findCustomerByEmail(email);
    }

    if (existingCustomer) {
      return { customer: existingCustomer, created: false };
    }

    // Create new customer
    const newCustomer = await this.createCustomer(studentData);
    return { customer: newCustomer, created: true };
  }

  async createOrSyncCobranca(alunoDataOrCustomerId: any, studentDataOrPlan?: any, planData?: any): Promise<AsaasPayment> {
    // Handle both old and new method signatures for backward compatibility
    let customerId: string;
    let studentData: any;
    let plan: any;

    if (typeof alunoDataOrCustomerId === 'string') {
      // Old signature: createOrSyncCobranca(customerId, studentData, planData)
      customerId = alunoDataOrCustomerId;
      studentData = studentDataOrPlan;
      plan = planData;
    } else {
      // New signature: createOrSyncCobranca(alunoData, planData)
      const alunoData = alunoDataOrCustomerId;
      plan = studentDataOrPlan;
      
      // Get or create customer first
      const { customer } = await this.getOrCreateAsaasCustomer(alunoData);
      customerId = customer.id;
      studentData = alunoData;
    }

    // Check if payment already exists for this student/plan
    const existingPayments = await this.getCustomerPayments(customerId);
    const planReference = `student_${studentData.user_id}_plan_${plan.id}`;
    
    const existingPayment = existingPayments.find((payment: any) => 
      payment.externalReference === planReference && payment.status === 'PENDING'
    );

    if (existingPayment) {
      console.log('Payment already exists for this student/plan:', existingPayment.id);
      return existingPayment;
    }

    // Create new payment with correct due date
    return await this.createPaymentForStudent(customerId, studentData, plan);
  }

  async syncExistingAsaasData(cpfOrEmail: string): Promise<{ customer: AsaasCustomer | null, payments: AsaasPayment[] }> {
    try {
      // Try to find customer by CPF first
      let customer = await this.findCustomerByCpf(cpfOrEmail);
      
      // If not found by CPF, try by email
      if (!customer && cpfOrEmail.includes('@')) {
        customer = await this.findCustomerByEmail(cpfOrEmail);
      }

      if (!customer) {
        return { customer: null, payments: [] };
      }

      // Get customer payments
      const payments = await this.getCustomerPayments(customer.id);
      return { customer, payments };
    } catch (error) {
      console.error('Error syncing existing ASAAS data:', error);
      return { customer: null, payments: [] };
    }
  }

  async getCustomerPayments(customerId: string): Promise<AsaasPayment[]> {
    try {
      const response = await this.client.get('/payments', {
        params: { customer: customerId }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error getting customer payments:', error);
      return [];
    }
  }

  // ── Subscription (recorrência mensal) ─────────────────────────────────────

  /** Calculate next due date from preferred day-of-month */
  private calculateNextDueDate(preferredDay: number): string {
    const today = new Date();
    const day = today.getDate();
    const safePreferredDay = Math.min(31, Math.max(1, Number(preferredDay) || 5));
    const targetMonth = day < safePreferredDay ? today.getMonth() : today.getMonth() + 1;
    const lastDayOfTargetMonth = new Date(today.getFullYear(), targetMonth + 1, 0).getDate();
    const dueDate = new Date(
      today.getFullYear(),
      targetMonth,
      Math.min(safePreferredDay, lastDayOfTargetMonth)
    );
    return dueDate.toISOString().split('T')[0];
  }

  /** Create a new recurring subscription (POST /subscriptions) */
  async createSubscription(data: CreateSubscriptionRequest): Promise<AsaasSubscription> {
    if (!this.isConfigured) throw new Error('ASAAS não configurado');
    console.log(`📅 Criando assinatura ASAAS: customer=${data.customer}, value=${data.value}, nextDueDate=${data.nextDueDate}`);
    const response = await this.client.post('/subscriptions', data);
    return response.data;
  }

  /** Cancel an active subscription (DELETE /subscriptions/:id) */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    if (!this.isConfigured) throw new Error('ASAAS não configurado');
    try {
      await this.client.delete(`/subscriptions/${subscriptionId}`);
      console.log(`✅ Assinatura ASAAS ${subscriptionId} cancelada`);
    } catch (error: any) {
      console.error(`❌ Erro ao cancelar assinatura ${subscriptionId}:`, error.response?.data || error.message);
      throw new Error(`Erro ao cancelar assinatura: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /** Look for an existing active subscription for a customer */
  async findExistingSubscription(customerId: string, externalReference?: string): Promise<AsaasSubscription | null> {
    try {
      const params: Record<string, any> = { customer: customerId };
      const response = await this.client.get('/subscriptions', { params });
      const subs: AsaasSubscription[] = response.data?.data || [];
      if (externalReference) {
        const match = subs.find(s => s.externalReference === externalReference && s.status === 'ACTIVE');
        return match || null;
      }
      return subs.find(s => s.status === 'ACTIVE') || null;
    } catch (error) {
      console.error('Erro ao buscar assinaturas existentes:', error);
      return null;
    }
  }

  /** Update subscription nextDueDate and value (PUT /subscriptions/:id) */
  async updateSubscription(subscriptionId: string, data: Partial<{ nextDueDate: string; value: number; externalReference: string; description: string }>): Promise<AsaasSubscription> {
    const response = await this.client.put(`/subscriptions/${subscriptionId}`, data);
    return response.data;
  }

  /** Get all payments (cobranças) linked to a subscription */
  async getSubscriptionPayments(subscriptionId: string, status?: string): Promise<AsaasPayment[]> {
    try {
      const params: Record<string, any> = { subscription: subscriptionId };
      if (status) params.status = status;
      const response = await this.client.get('/payments', { params });
      return response.data?.data || [];
    } catch (error) {
      console.error(`Erro ao buscar cobranças da assinatura ${subscriptionId}:`, error);
      return [];
    }
  }

  /** Update a single payment's due date (PUT /payments/:id) */
  async updatePaymentDueDate(paymentId: string, newDueDate: string): Promise<void> {
    try {
      await this.client.put(`/payments/${paymentId}`, { dueDate: newDueDate });
      console.log(`📅 Fatura ${paymentId} atualizada para vencimento ${newDueDate}`);
    } catch (error: any) {
      console.warn(`⚠️ Não foi possível atualizar vencimento da fatura ${paymentId}:`, error.response?.data || error.message);
    }
  }

  /**
   * Patch all PENDING/OVERDUE payments of a subscription to match a new preferred due day.
   * Keeps each payment in its own month, only adjusts the day.
   */
  async patchSubscriptionDueDates(subscriptionId: string, preferredDay: number): Promise<number> {
    const payments = await this.getSubscriptionPayments(subscriptionId);
    const toUpdate = payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE');
    let updated = 0;
    for (const payment of toUpdate) {
      const current = new Date(payment.dueDate + 'T12:00:00Z');
      const newDate = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), preferredDay));
      // Clamp: if day overflows month (e.g. Feb 30), JS auto-rolls — use last day of month
      const maxDay = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0)).getUTCDate();
      const clampedDay = Math.min(preferredDay, maxDay);
      const finalDate = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), clampedDay));
      const newDueDateStr = finalDate.toISOString().split('T')[0];
      if (newDueDateStr !== payment.dueDate) {
        await this.updatePaymentDueDate(payment.id, newDueDateStr);
        updated++;
      }
    }
    console.log(`✅ ${updated} fatura(s) tiveram o vencimento atualizado para dia ${preferredDay}`);
    return updated;
  }

  /**
   * Anti-duplicate: find or create a monthly subscription for a student.
   * If a subscription already exists for this customer (even without the system's externalReference,
   * e.g. a carnê created manually in ASAAS), adopts it and patches open invoice due dates instead
   * of creating a duplicate. Returns the subscription and whether it was just created.
   */
  async getOrCreateSubscription(
    customerId: string,
    valueReais: number,
    preferredDay: number,
    description: string,
    externalReference: string,
    billingType: 'BOLETO' | 'PIX' = 'BOLETO'
  ): Promise<{ subscription: AsaasSubscription; created: boolean }> {
    // 1. Exact match by our externalReference
    const exactMatch = await this.findExistingSubscription(customerId, externalReference);
    if (exactMatch) {
      console.log(`♻️ Assinatura já existe para ${externalReference}: ${exactMatch.id}`);
      // Still patch due dates in case preferredDay changed
      await this.patchSubscriptionDueDates(exactMatch.id, preferredDay);
      return { subscription: exactMatch, created: false };
    }

    // 2. Any active subscription for this customer (e.g. carnê criado manualmente no ASAAS)
    const anyExisting = await this.findExistingSubscription(customerId);
    if (anyExisting) {
      console.log(`🔗 Assinatura manual encontrada para cliente ${customerId}: ${anyExisting.id} — adotando e atualizando vencimentos`);
      // Tag it with our reference so future lookups hit the exact match
      try {
        await this.updateSubscription(anyExisting.id, { externalReference, description });
      } catch (err: any) {
        console.warn(`⚠️ Não foi possível atualizar externalReference da assinatura ${anyExisting.id}:`, err.message);
      }
      // Patch all pending/overdue invoices to the student's preferred due day
      await this.patchSubscriptionDueDates(anyExisting.id, preferredDay);
      return { subscription: { ...anyExisting, externalReference }, created: false };
    }

    // 3. Nothing found — create new subscription
    const nextDueDate = this.calculateNextDueDate(preferredDay);
    console.log(`📅 Próxima data de vencimento calculada: ${nextDueDate} (dia preferido: ${preferredDay})`);

    const subscription = await this.createSubscription({
      customer: customerId,
      billingType,
      value: valueReais,
      nextDueDate,
      cycle: 'MONTHLY',
      description,
      externalReference,
    });

    console.log(`✅ Assinatura recorrente criada: ${subscription.id} (${nextDueDate})`);
    return { subscription, created: true };
  }

  async getCustomerInvoices(customerId: string): Promise<any[]> {
    try {
      const response = await this.client.get('/payments', {
        params: { customer: customerId }
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error getting customer invoices:', error);
      return [];
    }
  }

  async isServiceConfigured(): Promise<boolean> {
    return this.isConfigured;
  }
}