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
 * ASAAS Service - Implementado seguindo documentação oficial
 * URL Sandbox: https://api-sandbox.asaas.com/v3
 * Headers: access_token, User-Agent, Content-Type
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

    // Configuração exata conforme documentação oficial ASAAS
    this.client = axios.create({
      baseURL: 'https://api-sandbox.asaas.com/v3',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SenseiSystem/1.0',
        'access_token': this.apiKey
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
   * Teste de conexão seguindo documentação oficial ASAAS
   * Testa primeiro com /customers (endpoint público) para validar autenticação
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🧪 Testing ASAAS connection with /customers endpoint...');
      const response = await this.client.get('/customers?limit=1');
      
      return {
        success: true,
        message: 'Conexão ASAAS OK ✅',
        data: {
          status: 'connected',
          endpoint: '/customers',
          hasData: response.data?.data ? response.data.data.length > 0 : false
        }
      };
    } catch (error: any) {
      console.error('🔥 ASAAS Connection Test Failed:', error.response?.data || error.message);
      
      // Tenta identificar o tipo de erro baseado na resposta
      if (error.response?.status === 401) {
        return {
          success: false,
          message: `Chave API inválida ❌ - ${error.response?.data?.errors?.[0]?.description || 'Unauthorized'}`
        };
      } else if (error.response?.status === 404) {
        return {
          success: false, 
          message: `Endpoint não encontrado ❌ - Verifique URL: ${this.client.defaults.baseURL}`
        };
      }
      
      return {
        success: false,
        message: `Erro ASAAS ❌ - Status: ${error.response?.status || 'Unknown'} - ${error.message}`
      };
    }
  }

  /**
   * Criar cliente no ASAAS
   */
  async createCustomer(studentData: any): Promise<AsaasCustomer> {
    try {
      console.log('📋 Raw student data received:', JSON.stringify(studentData, null, 2));
      
      const customerData: CreateCustomerRequest = {
        name: studentData.financialResponsibleName || studentData.financial_responsible_name,
        email: studentData.financialResponsibleEmail || studentData.financial_responsible_email,
        phone: studentData.financialResponsiblePhone || studentData.financial_responsible_phone,
        cpfCnpj: (studentData.financialResponsibleCpf || studentData.financial_responsible_cpf)?.replace(/\D/g, ''), // Remove formatting
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
    } catch (error: any) {
      console.error('❌ Error creating customer - Full error:', JSON.stringify(error.response?.data, null, 2));
      
      // Log detailed error information
      if (error.response?.data?.errors) {
        console.error('🔥 ASAAS API Errors:', JSON.stringify(error.response.data.errors, null, 2));
        error.response.data.errors.forEach((err: any, index: number) => {
          console.error(`   ${index + 1}. ${err.code}: ${err.description}`);
        });
      }
      
      throw new Error(`Failed to create customer in ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
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
        value: planData.amount / 100, // Convert from cents to reais
        dueDate: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        description: `Mensalidade SenseiSystem - ${studentData.first_name} ${studentData.last_name}`,
        externalReference: `COBRANCA_ALUNO_${studentData.user_id}`,
        notificationEnabled: true
      };

      console.log('💰 Plan data:', JSON.stringify(planData, null, 2));
      console.log('🔄 Creating ASAAS payment:', paymentData);
      const response = await this.client.post<AsaasPayment>('/payments', paymentData);
      console.log('✅ Payment created in ASAAS:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating payment - Full error:', JSON.stringify(error.response?.data, null, 2));
      
      // Log detailed error information
      if (error.response?.data?.errors) {
        console.error('🔥 ASAAS Payment Errors:', JSON.stringify(error.response.data.errors, null, 2));
        error.response.data.errors.forEach((err: any, index: number) => {
          console.error(`   ${index + 1}. ${err.code}: ${err.description}`);
        });
      }
      
      throw new Error(`Failed to create payment in ASAAS: ${error.response?.data?.errors?.[0]?.description || error.message}`);
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

  /**
   * 🎯 ARKAIDEV ENHANCEMENT: Buscar ou criar cliente ASAAS evitando duplicatas
   * Primeiro verifica se o cliente já existe (por CPF ou email)
   * Se existir, retorna o customerId
   * Se não existir, cria um novo cliente
   */
  async getOrCreateAsaasCustomer(responsavel: any): Promise<string> {
    try {
      const cpf = responsavel.cpf?.replace(/\D/g, '');
      
      console.log('🔍 Verificando se cliente já existe no ASAAS...');
      console.log('📋 CPF para busca:', cpf);
      
      // 1. Buscar por CPF primeiro
      if (cpf) {
        const existingCustomerByCpf = await this.findCustomerByCpf(cpf);
        if (existingCustomerByCpf) {
          console.log('✅ Cliente encontrado no ASAAS por CPF:', existingCustomerByCpf.id);
          return existingCustomerByCpf.id;
        }
      }
      
      // 2. Buscar por e-mail se CPF não encontrou
      if (responsavel.email) {
        const existingCustomerByEmail = await this.findCustomerByEmail(responsavel.email);
        if (existingCustomerByEmail) {
          console.log('✅ Cliente encontrado no ASAAS por e-mail:', existingCustomerByEmail.id);
          return existingCustomerByEmail.id;
        }
      }
      
      // 3. Se não encontrou, criar novo cliente
      console.log('🆕 Cliente não encontrado, criando novo no ASAAS...');
      const newCustomer = await this.createCustomerFromResponsavel(responsavel);
      console.log('✅ Novo cliente criado no ASAAS:', newCustomer.id);
      return newCustomer.id;
      
    } catch (error: any) {
      console.error('❌ Erro em getOrCreateAsaasCustomer:', error);
      throw new Error(`Erro ao buscar/criar cliente ASAAS: ${error.message}`);
    }
  }

  /**
   * 🔍 Buscar cliente por e-mail
   */
  private async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    try {
      const response = await this.client.get('/customers', {
        params: { email }
      });
      
      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar cliente por email:', error);
      return null;
    }
  }

  /**
   * 💰 ARKAIDEV ENHANCEMENT: Criar ou sincronizar cobrança evitando duplicatas
   * Verifica se já existe cobrança para o cliente
   * Se existir cobrança pendente/ativa, apenas vincula
   * Se não existir, cria nova cobrança
   */
  async createOrSyncCobranca(aluno: any, plano: any): Promise<AsaasPayment> {
    try {
      console.log('🔄 Iniciando createOrSyncCobranca...');
      
      // 1. Obter ou criar cliente
      const customerId = await this.getOrCreateAsaasCustomer(aluno.responsavel);
      console.log('👤 Customer ID obtido:', customerId);
      
      // 2. Buscar pagamentos existentes do cliente
      console.log('🔍 Buscando pagamentos existentes...');
      const existingPayments = await this.getCustomerPayments(customerId);
      console.log(`📊 Encontrados ${existingPayments.length} pagamentos para o cliente`);
      
      // 3. Verificar se existe cobrança ativa/pendente com o mesmo valor
      const planValue = plano.amount / 100; // Converter centavos para reais
      const activePendingPayment = existingPayments.find(payment => 
        payment.value === planValue && 
        ['PENDING', 'OVERDUE'].includes(payment.status)
      );
      
      if (activePendingPayment) {
        console.log('✅ Cobrança existente encontrada, vinculando:', activePendingPayment.id);
        return activePendingPayment;
      }
      
      // 4. Se não há cobrança ativa, criar nova
      console.log('🆕 Criando nova cobrança...');
      const newPayment = await this.createPaymentForStudent(customerId, aluno, plano);
      console.log('✅ Nova cobrança criada:', newPayment.id);
      return newPayment;
      
    } catch (error: any) {
      console.error('❌ Erro em createOrSyncCobranca:', error);
      throw new Error(`Erro ao criar/sincronizar cobrança: ${error.message}`);
    }
  }

  /**
   * 📋 Buscar pagamentos de um cliente
   */
  private async getCustomerPayments(customerId: string): Promise<AsaasPayment[]> {
    try {
      const response = await this.client.get('/payments', {
        params: { 
          customer: customerId,
          limit: 100 // Buscar últimos 100 pagamentos
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar pagamentos do cliente:', error);
      return [];
    }
  }

  /**
   * 🏗️ Criar cliente a partir dos dados do responsável
   */
  private async createCustomerFromResponsavel(responsavel: any): Promise<AsaasCustomer> {
    const customerData: CreateCustomerRequest = {
      name: responsavel.nome || responsavel.name,
      email: responsavel.email,
      cpfCnpj: responsavel.cpf?.replace(/\D/g, '') || '',
      mobilePhone: responsavel.telefone || responsavel.phone,
      postalCode: responsavel.cep?.replace(/\D/g, '') || '',
      address: responsavel.endereco || responsavel.address,
      addressNumber: responsavel.numero || responsavel.addressNumber || '',
      complement: responsavel.complemento || responsavel.complement || '',
      province: responsavel.cidade || responsavel.city || '',
      externalReference: `RESPONSAVEL_${Date.now()}`,
      observations: `Responsável financeiro criado via SenseiSystem`
    };

    console.log('🔄 Criando cliente ASAAS:', customerData);
    const response = await this.client.post<AsaasCustomer>('/customers', customerData);
    console.log('✅ Cliente criado no ASAAS:', response.data.id);
    return response.data;
  }

  /**
   * 🔗 ARKAIDEV ENHANCEMENT: Sincronizar dados existentes do ASAAS
   * Função para re-sincronizar dados caso ocorra perda de vínculo
   */
  async syncExistingAsaasData(cpfOrEmail: string): Promise<{ customer: AsaasCustomer | null, payments: AsaasPayment[] }> {
    try {
      console.log('🔄 Sincronizando dados existentes do ASAAS...');
      
      // Buscar cliente
      let customer = null;
      if (cpfOrEmail.includes('@')) {
        customer = await this.findCustomerByEmail(cpfOrEmail);
      } else {
        customer = await this.findCustomerByCpf(cpfOrEmail.replace(/\D/g, ''));
      }
      
      if (!customer) {
        console.log('❌ Cliente não encontrado no ASAAS');
        return { customer: null, payments: [] };
      }
      
      // Buscar pagamentos do cliente
      const payments = await this.getCustomerPayments(customer.id);
      
      console.log(`✅ Sincronização concluída: Cliente ${customer.id}, ${payments.length} pagamentos`);
      return { customer, payments };
      
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error);
      throw new Error(`Erro ao sincronizar dados ASAAS: ${error.message}`);
    }
  }
}