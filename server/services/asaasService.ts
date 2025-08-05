import axios, { AxiosInstance, AxiosError } from 'axios';
import { storage } from '../storage';

// Types for ASAAS API
interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
  postalCode?: string;
  addressNumber?: string;
  addressComplement?: string;
}

interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER';
  value: number;
  netValue?: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: string;
  pixCopyAndPaste?: string;
}

interface CreateCustomerRequest {
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
  postalCode?: string;
  addressNumber?: string;
  addressComplement?: string;
}

interface CreatePaymentRequest {
  customer: string;
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

export class AsaasService {
  private client: AxiosInstance;
  private apiKey: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://www.asaas.com/api/v3',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include API key
    this.client.interceptors.request.use(async (config) => {
      if (!this.apiKey) {
        await this.loadApiKey();
      }
      
      if (this.apiKey) {
        config.headers.Authorization = `Bearer ${this.apiKey}`;
      }
      
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('ASAAS API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    );
  }

  private async loadApiKey(): Promise<void> {
    try {
      // First try environment variable
      if (process.env.ASAAS_API_KEY) {
        this.apiKey = process.env.ASAAS_API_KEY;
        console.log('✅ ASAAS API Key loaded from environment');
        return;
      }

      // Fallback to database config
      const config = await storage.getSchoolConfig();
      if (config?.asaasApiKey) {
        this.apiKey = config.asaasApiKey;
        console.log('✅ ASAAS API Key loaded from database');
        return;
      }
      
      throw new Error('ASAAS API Key not configured in environment or database');
    } catch (error) {
      console.error('❌ Failed to load ASAAS API key:', error);
      throw new Error('ASAAS integration not properly configured');
    }
  }

  /**
   * Criar ou buscar cliente no ASAAS
   */
  async createOrGetCustomer(customerData: CreateCustomerRequest): Promise<AsaasCustomer> {
    try {
      // First try to find existing customer by CPF/CNPJ
      const existingCustomer = await this.findCustomerByCpf(customerData.cpfCnpj);
      if (existingCustomer) {
        console.log('Customer already exists in ASAAS:', existingCustomer.id);
        return existingCustomer;
      }

      // Create new customer
      const response = await this.client.post<AsaasCustomer>('/customers', customerData);
      console.log('New customer created in ASAAS:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('Error creating/getting customer:', error);
      throw new Error('Failed to create or get customer in ASAAS');
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
      await this.loadApiKey();
      return !!this.apiKey;
    } catch {
      return false;
    }
  }

  /**
   * Testar conexão com ASAAS
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/customers?limit=1');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const asaasService = new AsaasService();