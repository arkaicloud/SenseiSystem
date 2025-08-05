const axios = require('axios');

// Test ARKAIDEV ASAAS Anti-Duplicate Functions
async function testAsaasIntegration() {
  try {
    console.log('🧪 Testando funções ARKAIDEV de verificação e vinculação ASAAS...');
    
    // 1. Test check customer endpoint
    console.log('\n1. Testando verificação de cliente...');
    try {
      const checkResponse = await axios.get('http://localhost:5000/api/asaas/check-customer', {
        params: { cpf: '12345678901' },
        withCredentials: true,
        headers: {
          'Cookie': 'connect.sid=your_session_cookie_here'
        }
      });
      
      console.log('✅ Resposta da verificação:', checkResponse.data);
    } catch (error) {
      console.log('❌ Erro na verificação:', error.response?.data || error.message);
    }

    // 2. Test direct ASAAS service functions
    console.log('\n2. Testando AsaasService diretamente...');
    const { AsaasService } = require('./server/services/asaasService');
    const asaasService = new AsaasService();
    
    // Test responsavel data
    const mockResponsavel = {
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      cpf: '12345678901',
      telefone: '11999999999',
      endereco: 'Rua Teste, 123',
      numero: '123',
      cep: '12345678',
      cidade: 'São Paulo'
    };
    
    const mockPlano = {
      amount: 20000, // R$ 200,00 em centavos
      name: 'Plano Mensal'
    };
    
    const mockAluno = {
      first_name: 'Pedro',
      last_name: 'Santos',
      user_id: 999,
      responsavel: mockResponsavel
    };
    
    console.log('🔍 Testando getOrCreateAsaasCustomer...');
    try {
      const customerId = await asaasService.getOrCreateAsaasCustomer(mockResponsavel);
      console.log('✅ Customer ID obtido:', customerId);
      
      console.log('💰 Testando createOrSyncCobranca...');
      const payment = await asaasService.createOrSyncCobranca(mockAluno, mockPlano);
      console.log('✅ Payment criado/vinculado:', {
        id: payment.id,
        customer: payment.customer,
        value: payment.value,
        status: payment.status
      });
      
    } catch (error) {
      console.log('❌ Erro nos testes diretos:', error.message);
      console.log('📋 Detalhes:', error.response?.data || 'Sem detalhes adicionais');
    }
    
    // 3. Test syncExistingAsaasData
    console.log('\n3. Testando sincronização de dados existentes...');
    try {
      const syncResult = await asaasService.syncExistingAsaasData('12345678901');
      console.log('✅ Dados sincronizados:', {
        customer: syncResult.customer?.id || 'Não encontrado',
        paymentsCount: syncResult.payments.length
      });
    } catch (error) {
      console.log('❌ Erro na sincronização:', error.message);
    }
    
    console.log('\n🎯 Testes ARKAIDEV concluídos!');
    
  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Execute tests
testAsaasIntegration();