interface AsaasCustomer {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  address?: string;
  externalReference?: string;
}

interface AsaasPayment {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'DEBIT_CARD';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}

interface AsaasWebhookEvent {
  event: string;
  payment: {
    id: string;
    customer: string;
    value: number;
    netValue?: number;
    originalValue?: number;
    status: string;
    billingType: string;
    dueDate: string;
    originalDueDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    externalReference?: string;
    description?: string;
  };
}

export class AsaasService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey?: string, useSandbox: boolean = true) {
    // Use sandbox environment by default for testing
    this.baseUrl = useSandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3';
    this.apiKey = apiKey || process.env.ASAAS_API_KEY || '';
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ASAAS API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ASAAS API Error:', error);
      throw error;
    }
  }

  // Criar cliente no ASAAS
  async createCustomer(customerData: AsaasCustomer): Promise<{ id: string; name: string; email: string }> {
    console.log('🔄 Creating ASAAS customer:', customerData.name);
    
    const response = await this.makeRequest('/customers', 'POST', customerData);
    
    console.log('✅ ASAAS customer created:', response.id);
    return response;
  }

  // Criar cobrança no ASAAS
  async createPayment(paymentData: AsaasPayment): Promise<{ id: string; status: string; invoiceUrl?: string; pixQrCode?: string }> {
    console.log('💰 Creating ASAAS payment for customer:', paymentData.customer);
    
    const response = await this.makeRequest('/payments', 'POST', paymentData);
    
    console.log('✅ ASAAS payment created:', response.id);
    return response;
  }

  // Buscar informações de um pagamento
  async getPayment(paymentId: string): Promise<any> {
    const response = await this.makeRequest(`/payments/${paymentId}`, 'GET');
    return response;
  }

  // Listar pagamentos de um cliente
  async getCustomerPayments(customerId: string, limit: number = 100): Promise<any> {
    const response = await this.makeRequest(`/payments?customer=${customerId}&limit=${limit}`, 'GET');
    return response;
  }

  // Criar cobrança recorrente
  async createSubscription(subscriptionData: {
    customer: string;
    billingType: string;
    value: number;
    cycle: 'MONTHLY' | 'YEARLY';
    description?: string;
    nextDueDate: string;
    externalReference?: string;
  }): Promise<any> {
    console.log('🔄 Creating ASAAS subscription for customer:', subscriptionData.customer);
    
    const response = await this.makeRequest('/subscriptions', 'POST', subscriptionData);
    
    console.log('✅ ASAAS subscription created:', response.id);
    return response;
  }

  // Validar webhook do ASAAS
  validateWebhook(event: AsaasWebhookEvent): boolean {
    // Implementar validação de webhook se necessário
    return Boolean(event && event.event && event.payment);
  }

  // Testar conexão com a API ASAAS
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🔍 Testing ASAAS API connection...');
      
      if (!this.apiKey) {
        return {
          success: false,
          message: 'API Key do ASAAS não configurada'
        };
      }

      // Tentar buscar informações da conta
      const response = await this.makeRequest('/myAccount');
      
      return {
        success: true,
        message: 'Conexão com ASAAS estabelecida com sucesso',
        data: {
          name: response.name || 'Não informado',
          email: response.email || 'Não informado',
          environment: this.baseUrl.includes('sandbox') ? 'Sandbox (Teste)' : 'Produção'
        }
      };
    } catch (error) {
      console.error('❌ Error testing ASAAS connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido ao conectar com ASAAS'
      };
    }
  }

  // Processar evento de webhook
  processWebhookEvent(event: AsaasWebhookEvent): {
    paymentId: string;
    status: string;
    value: number;
    paidAt?: string;
    externalReference?: string;
  } {
    return {
      paymentId: event.payment.id,
      status: this.mapAsaasStatusToLocal(event.payment.status),
      value: event.payment.value,
      paidAt: event.payment.paymentDate || event.payment.clientPaymentDate,
      externalReference: event.payment.externalReference,
    };
  }

  // Mapear status do ASAAS para status local
  private mapAsaasStatusToLocal(asaasStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'pending',
      'RECEIVED': 'paid',
      'RECEIVED_IN_CASH': 'paid',
      'CONFIRMED': 'paid',
      'OVERDUE': 'overdue',
      'REFUNDED': 'cancelled',
      'CANCELLED': 'cancelled',
      'CHARGEBACK_REQUESTED': 'failed',
      'CHARGEBACK_DISPUTE': 'failed',
      'AWAITING_CHARGEBACK_REVERSAL': 'failed',
    };

    return statusMap[asaasStatus] || 'pending';
  }
}

export default AsaasService;