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

  async findCustomerByCpf(cpfCnpj: string): Promise<AsaasCustomer | null> {
    try {
      const response = await this.client.get('/customers', {
        params: { cpfCnpj }
      });
      
      return response.data?.data?.[0] || null;
    } catch (error) {
      console.error('Error finding customer by CPF:', error);
      return null;
    }
  }

  async createPaymentForStudent(customerId: string, studentData: any, planData: any): Promise<AsaasPayment> {
    if (!this.isConfigured) {
      throw new Error('ASAAS not configured');
    }

    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setMonth(dueDate.getMonth() + (planData.frequency === 'monthly' ? 1 : 12));

    const paymentData: CreatePaymentRequest = {
      customer: customerId,
      billingType: 'BOLETO',
      value: planData.amount / 100, // Convert cents to reais
      dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
      description: `Mensalidade ${studentData.first_name} ${studentData.last_name} - ${planData.name}`,
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

    if (existingCustomer) {
      return { customer: existingCustomer, created: false };
    }

    // Create new customer
    const newCustomer = await this.createCustomer(studentData);
    return { customer: newCustomer, created: true };
  }

  async createOrSyncCobranca(customerId: string, studentData: any, planData: any): Promise<AsaasPayment> {
    // Check if payment already exists for this student/plan
    const existingPayments = await this.getCustomerPayments(customerId);
    const planReference = `student_${studentData.user_id}_plan_${planData.id}`;
    
    const existingPayment = existingPayments.find((payment: any) => 
      payment.externalReference === planReference && payment.status === 'PENDING'
    );

    if (existingPayment) {
      console.log('Payment already exists for this student/plan:', existingPayment.id);
      return existingPayment;
    }

    // Create new payment
    return await this.createPaymentForStudent(customerId, studentData, planData);
  }

  async syncExistingAsaasData(cpfOrEmail: string): Promise<{ customer: AsaasCustomer | null, payments: AsaasPayment[] }> {
    try {
      // Try to find customer by CPF first
      let customer = await this.findCustomerByCpf(cpfOrEmail);
      
      // If not found by CPF, try by email
      if (!customer && cpfOrEmail.includes('@')) {
        const response = await this.client.get('/customers', {
          params: { email: cpfOrEmail }
        });
        customer = response.data?.data?.[0] || null;
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

  async getCustomerInvoices(customerId: string): Promise<any[]> {
    try {
      const response = await this.client.get('/payments', {
        params: { 
          customer: customerId,
          status: 'PENDING'
        }
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