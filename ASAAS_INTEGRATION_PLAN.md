# Plano de Integração Asaas - SenseiSystem

## 1. Estrutura de Configuração da Escola

### Campos a adicionar na tela "Configurações > Da Escola"

```typescript
// Adicionar ao schema shared/schema.ts
export const schoolConfig = pgTable("school_config", {
  id: serial("id").primaryKey(),
  schoolName: varchar("school_name", { length: 255 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  website: varchar("website", { length: 200 }),
  congratsMessage: text("congrats_message"),
  
  // NOVOS CAMPOS PARA ASAAS
  asaasEnabled: boolean("asaas_enabled").default(false),
  asaasEnvironment: varchar("asaas_environment", { length: 20 }).default("sandbox"), // "sandbox" ou "production"
  asaasApiKey: varchar("asaas_api_key", { length: 500 }), // Criptografado
  asaasAccountId: varchar("asaas_account_id", { length: 100 }),
  asaasWebhookConfigured: boolean("asaas_webhook_configured").default(false),
  asaasWebhookUrl: varchar("asaas_webhook_url", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Interface da Tela de Configuração

**Seção: "Integração com Asaas"**
- [ ] Ativar integração com Asaas (toggle)
- Ambiente: [Sandbox / Produção] (select)
- Token da API: [campo de texto sensível] 
- ID da Conta: [campo de texto opcional]
- Status do Webhook: [Configurado ✅ / Pendente ⏳]
- [Botão: Testar Conexão]
- [Botão: Configurar Webhook]

## 2. Endpoints da API Asaas

### Base URLs:
- **Sandbox**: `https://sandbox.asaas.com/api/v3`
- **Produção**: `https://api.asaas.com/v3`

### Principais Endpoints:

#### 2.1 Criar Cliente
```
POST /customers
{
  "name": "Nome do Aluno",
  "cpfCnpj": "12345678901",
  "email": "aluno@email.com",
  "phone": "11999999999",
  "mobilePhone": "11999999999"
}
```

#### 2.2 Gerar Cobrança
```
POST /payments
{
  "customer": "cus_000005492852",
  "billingType": "PIX", // PIX, BOLETO, CREDIT_CARD
  "value": 150.00,
  "dueDate": "2025-02-15",
  "description": "Mensalidade Jiu-Jitsu - Janeiro 2025",
  "externalReference": "SENSEI_PAYMENT_123"
}
```

#### 2.3 Consultar Status da Cobrança
```
GET /payments/{id}
```

#### 2.4 Configurar Webhook
```
POST /webhook
{
  "url": "https://seusite.replit.app/api/asaas/webhook",
  "email": "admin@suaacademia.com",
  "events": [
    "PAYMENT_CONFIRMED",
    "PAYMENT_OVERDUE", 
    "PAYMENT_DELETED",
    "PAYMENT_REFUNDED"
  ]
}
```

## 3. Implementação Backend

### 3.1 Serviço Asaas
```typescript
// server/services/asaasService.ts
export class AsaasService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string, environment: 'sandbox' | 'production') {
    this.apiKey = apiKey;
    this.baseUrl = environment === 'production' 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  async createCustomer(customerData: AsaasCustomer): Promise<AsaasCustomerResponse> {
    // Implementar criação de cliente
  }

  async createPayment(paymentData: AsaasPayment): Promise<AsaasPaymentResponse> {
    // Implementar criação de cobrança
  }

  async getPaymentStatus(paymentId: string): Promise<AsaasPaymentResponse> {
    // Implementar consulta de status
  }

  async setupWebhook(webhookUrl: string): Promise<AsaasWebhookResponse> {
    // Implementar configuração de webhook
  }
}
```

### 3.2 Rotas de Integração
```typescript
// server/routes.ts - Adicionar seção Asaas

// Testar conexão com Asaas
app.post("/api/asaas/test-connection", isAuthenticated, isAdmin, async (req, res) => {
  // Implementar teste de conexão
});

// Webhook para receber notificações do Asaas
app.post("/api/asaas/webhook", async (req, res) => {
  // Implementar processamento de webhooks
});

// Gerar cobrança via Asaas
app.post("/api/asaas/create-payment", isAuthenticated, isAdmin, async (req, res) => {
  // Implementar criação de cobrança
});

// Sincronizar status de pagamentos
app.post("/api/asaas/sync-payments", isAuthenticated, isAdmin, async (req, res) => {
  // Implementar sincronização
});
```

### 3.3 Webhook Handler
```typescript
// server/webhookHandler.ts
export async function handleAsaasWebhook(data: AsaasWebhookPayload) {
  switch (data.event) {
    case 'PAYMENT_CONFIRMED':
      await markPaymentAsPaid(data.payment.id);
      break;
    case 'PAYMENT_OVERDUE':
      await markPaymentAsOverdue(data.payment.id);
      break;
    case 'PAYMENT_REFUNDED':
      await markPaymentAsRefunded(data.payment.id);
      break;
  }
}
```

## 4. Fluxo de Integração

### 4.1 Cadastro de Pagamento
1. Admin cria pagamento no SenseiSystem
2. Sistema verifica se Asaas está habilitado
3. Se sim: cria cliente no Asaas (se não existir)
4. Gera cobrança no Asaas
5. Armazena ID da cobrança no pagamento local
6. Retorna dados para frontend (QR Code PIX, linha digitável, etc.)

### 4.2 Confirmação de Pagamento  
1. Asaas envia webhook de confirmação
2. Sistema atualiza status do pagamento
3. Notifica aluno/admin via sistema interno
4. Reativa acesso do aluno (se estava bloqueado)

### 4.3 Vencimento
1. Asaas envia webhook de vencimento
2. Sistema marca pagamento como vencido
3. Opcionalmente bloqueia acesso do aluno
4. Notifica admin sobre inadimplência

## 5. Segurança

### 5.1 Armazenamento Seguro
- API Key criptografada no banco
- Usar variáveis de ambiente para chaves de criptografia
- Logs de todas as transações

### 5.2 Validação de Webhook
- Verificar assinatura do webhook
- Validar IPs de origem (whitelist Asaas)
- Rate limiting nos endpoints de webhook

## 6. Interface Frontend

### 6.1 Tela de Configuração
- Formulário para configurar credenciais Asaas
- Botão de teste de conexão
- Status visual da integração

### 6.2 Tela de Pagamentos
- Mostrar status sincronizado com Asaas
- Botões para gerar cobrança
- Exibir QR Code PIX e linha digitável
- Link para pagamento online

## 7. Próximos Passos

1. ✅ Corrigir erro de data em pagamentos
2. 🔄 Implementar schema de configuração Asaas
3. 🔄 Criar serviço AsaasService
4. 🔄 Implementar endpoints de integração
5. 🔄 Criar interface de configuração
6. 🔄 Implementar webhook handler
7. 🔄 Testes em ambiente sandbox
8. 🔄 Deploy e configuração produção