import axios, { AxiosInstance } from 'axios';

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
 * ASAAS Service - Implementado seguindo ARKAIDEV checklist
 * URL Sandbox: https://sandbox.asaas.com/api/v3
 * Header: Authorization: Bearer <API_KEY>
 */
export class AsaasService {
  private client: AxiosInstance;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('ASAAS_API_KEY environment variable is required');
    }

    console.log('🔑 ASAAS API Key loaded from environment (length:', this.apiKey.length, ')');
    console.log('🔧 ASAAS Service initialized with Sandbox URL');

    // Configuração exata conforme ARKAIDEV checklist
    this.client = axios.create({
      baseURL: 'https://sandbox.asaas.com/api/v3',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Log de requisições para debug
    this.client.interceptors.request.use((config) => {
      console.log('📤 ASAAS Request:', config.method?.toUpperCase(), config.url);
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        console.log('📥 ASAAS Response OK:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('❌ ASAAS API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Teste de conexão seguindo ARKAIDEV checklist
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🧪 Testing ASAAS connection with /me endpoint...');
      const response = await this.client.get('/me');
      
      return {
        success: true,
        message: 'Conexão OK ✅',
        data: response.data
      };
    } catch (error: any) {
      console.error('🔥 ASAAS Connection Test Failed:', error.response?.data || error.message);
      
      return {
        success: false,
        message: `Erro ASAAS ❌ - Status: ${error.response?.status || 'Unknown'} - ${error.response?.data?.errors?.[0]?.description || error.message}`
      };
    }
  }

  /**
   * Criar cliente no ASAAS
   */
  async createCustomer(studentData: any): Promise<AsaasCustomer> {
    try {
      const customerData: CreateCustomerRequest = {
        name: studentData.financial_responsible_name,
        email: studentData.financial_responsible_email,
        phone: studentData.financial_responsible_phone,
        cpfCnpj: studentData.financial_responsible_cpf?.replace(/\D/g, ''), // Remove formatting
        postalCode: studentData.zipCode?.replace(/\D/g, ''), // Remove formatting  
        address: studentData.street,
        addressNumber: studentData.number,
        complement: studentData.complement,
        province: studentData.neighborhood,
        externalReference: `ALUNO_${studentData.user_id}`,
        notificationDisabled: false,
        observations: `Responsável financeiro do aluno ${studentData.first_name} ${studentData.last_name}`
      };

      console.log('🔄 Creating ASAAS customer:', customerData);
      const response = await this.client.post<AsaasCustomer>('/customers', customerData);
      console.log('✅ Customer created in ASAAS:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating customer:', error);
      throw new Error('Failed to create customer in ASAAS');
    }
  }

  /**
   * Buscar cliente por CPF/CNPJ
   */
  private async findCustomerByCpf(cpfCnpj: string): Promise<AsaasCustomer | null> {
    try {
      const response = await this.client.get('/customers', {
        params: { cpfCnpj }
      });
      
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error finding customer by CPF:', error);
      return null;
    }
  }

  /**
   * Criar cobrança completa no ASAAS
   */
  async createPaymentForStudent(customerId: string, studentData: any, planData: any): Promise<AsaasPayment> {
    try {
      // Calculate due date (next month)
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 1);
      
      const paymentData: CreatePaymentRequest = {
        customer: customerId,
        billingType: 'BOLETO',
        value: planData.price,
        dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        description: `Mensalidade SenseiSystem - ${studentData.first_name} ${studentData.last_name}`,
        externalReference: `COBRANCA_ALUNO_${studentData.user_id}`,
        notificationEnabled: true
      };

      console.log('🔄 Creating ASAAS payment:', paymentData);
      const response = await this.client.post<AsaasPayment>('/payments', paymentData);
      console.log('✅ Payment created in ASAAS:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating payment:', error);
      throw new Error('Failed to create payment in ASAAS');
    }
  }

  /**
   * Criar pagamento (título/cobrança)
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<AsaasPayment> {
    try {
      const response = await this.client.post<AsaasPayment>('/payments', paymentData);
      console.log('Payment created in ASAAS:', response.data.id);
      
      // Se for PIX, buscar QR Code
      if (paymentData.billingType === 'PIX') {
        const pixData = await this.getPixQrCode(response.data.id);
        response.data.pixQrCode = pixData.qrCode;
        response.data.pixCopyAndPaste = pixData.payload;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error('Failed to create payment in ASAAS');
    }
  }

  /**
   * Buscar QR Code do PIX
   */
  private async getPixQrCode(paymentId: string): Promise<{ qrCode: string; payload: string }> {
    try {
      const response = await this.client.get(`/payments/${paymentId}/pixQrCode`);
      return {
        qrCode: response.data.encodedImage,
        payload: response.data.payload
      };
    } catch (error) {
      console.error('Error getting PIX QR Code:', error);
      return { qrCode: '', payload: '' };
    }
  }

  /**
   * Buscar status de um pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<AsaasPayment> {
    try {
      const response = await this.client.get<AsaasPayment>(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw new Error('Failed to get payment status from ASAAS');
    }
  }

  /**
   * Verificar se a integração está configurada
   */
  async isConfigured(): Promise<boolean> {
    try {
      const testResult = await this.testConnection();
      return testResult.success;
    } catch (error) {
      return false;
    }
  }
}