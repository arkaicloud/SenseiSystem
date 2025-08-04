
# 📊 Estrutura do Banco de Dados - SenseiSystem

## Visão Geral

O SenseiSystem utiliza PostgreSQL como sistema de gerenciamento de banco de dados, com uma arquitetura robusta e bem estruturada para suportar todas as funcionalidades de um sistema de gestão para academias de artes marciais.

## 🏗️ Arquitetura do Banco

### Tecnologias Utilizadas
- **PostgreSQL** - Banco de dados principal
- **Drizzle ORM** - ORM para TypeScript/JavaScript
- **Neon Database** - Hosting PostgreSQL serverless

### Extensões Habilitadas
- **uuid-ossp** - Geração de UUIDs únicos

## 📋 Tipos Enumerados (ENUMs)

```sql
-- Tipos de usuário no sistema
user_role: 'admin' | 'instructor' | 'student'

-- Níveis de faixa no Jiu-Jitsu
belt_level: 'white' | 'blue' | 'purple' | 'brown' | 'black'

-- Status de pagamento
payment_status: 'paid' | 'pending' | 'overdue'

-- Status de presença
attendance_status: 'present' | 'absent' | 'late'

-- Tipos de documento
document_type: 'health_form' | 'graduation_certificate' | 'medical_certificate' | 'identification' | 'contract' | 'other'

-- Status de pagamento da escola (SaaS)
school_payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'failed'

-- Tipos de ação de risco
risk_action: 'call' | 'email' | 'whatsapp' | 'visit' | 'discount' | 'other'
```

## 🗂️ Estrutura das Tabelas

### 👥 Tabela `users` (Usuários Base)
**Propósito**: Tabela principal que armazena informações básicas de todos os usuários do sistema.

**Campos Principais**:
- `id` - Identificador único (SERIAL PRIMARY KEY)
- `firstName`, `lastName` - Nome completo
- `username` - Nome de usuário único
- `email` - Email único
- `password` - Senha criptografada
- `role` - Tipo de usuário (admin/instructor/student)
- `phone` - Telefone de contato
- `emergencyContact` - Contato de emergência
- `birthDate` - Data de nascimento
- **Endereço completo**: `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `zipCode`
- `joinDate` - Data de cadastro
- `active` - Status ativo/inativo
- `status` - Status do usuário ('pending', 'active', 'inactive', 'blocked')

**Sistema de Streak de Login**:
- `currentStreak` - Sequência atual de logins
- `longestStreak` - Maior sequência de logins
- `lastLoginDate` - Última data de login
- `totalLogins` - Total de logins realizados

### 👨‍🎓 Tabela `students` (Estudantes)
**Propósito**: Extensão da tabela users com informações específicas dos alunos.

**Campos Específicos**:
- `userId` - Referência para users (FK)
- `beltLevel` - Nível da faixa atual
- `stripes` - Número de listras (0-4)
- `lastPromotionDate` - Data da última graduação
- `attendanceRate` - Taxa de presença (%)
- `notes` - Observações sobre o aluno

**Personalização de Avatar**:
- `avatarColor` - Cor do avatar
- `avatarStyle` - Estilo do avatar
- `avatarImage` - URL da imagem do avatar

**Responsável Financeiro**:
- `financialResponsibleName` - Nome do responsável
- `financialResponsibleEmail` - Email do responsável
- `financialResponsiblePhone` - Telefone do responsável
- `financialResponsibleCpf` - CPF do responsável
- `financialResponsibleRelation` - Relação ('self', 'parent', 'guardian', 'spouse')

**Integração ASAAS**:
- `asaasCustomerId` - ID do cliente no ASAAS
- `asaasSubscriptionId` - ID da assinatura no ASAAS

**Configurações de Pagamento**:
- `paymentPlanId` - Plano de pagamento vinculado
- `preferredDueDate` - Dia preferido para vencimento (1-28)

### 🏫 Tabela `school_config` (Configuração da Escola)
**Propósito**: Configurações gerais da academia/escola (modelo multi-tenant).

**Informações da Escola**:
- `schoolName` - Nome da academia
- `logoUrl` - URL do logotipo
- `address`, `phone`, `email`, `website` - Dados de contato

**Personalização Visual**:
- `defaultTheme` - Tema padrão ('light'/'dark')
- `primaryColor` - Cor primária da escola
- `secondaryColor` - Cor secundária da escola

**Configurações Operacionais**:
- `attendanceMaxDaysAhead` - Máx. dias antecipação para aulas (padrão: 7)
- `congratsMessage` - Mensagem de parabéns para graduações

**Integração ASAAS & SaaS**:
- `asaasCustomerId` - ID da escola no ASAAS
- `asaasApiKey` - Chave API do ASAAS
- `planValue` - Valor do plano SaaS (centavos)
- `planType` - Tipo do plano ('monthly')
- `trialEndDate` - Data fim do período trial

### 💰 Tabela `school_payments` (Pagamentos da Escola)
**Propósito**: Controle de pagamentos da escola para o SaaS SenseiSystem.

**Campos**:
- `tenantId` - Referência para school_config
- `asaasPaymentId` - ID do pagamento no ASAAS
- `status` - Status do pagamento
- `dueDate` - Data de vencimento
- `value` - Valor em centavos
- `paidAt` - Data do pagamento
- `description` - Descrição (padrão: "Mensalidade SenseiSystem")

### 📅 Tabela `school_events` (Eventos da Escola)
**Propósito**: Gerenciamento de eventos, campeonatos e atividades especiais.

**Campos**:
- `title` - Título do evento
- `description` - Descrição detalhada
- `eventDate` - Data e hora do evento
- `location` - Local do evento
- `imageUrl` - Imagem promocional
- `createdBy` - Usuário que criou o evento
- `isActive` - Status ativo/inativo

### 🥋 Tabela `classes` (Aulas/Turmas)
**Propósito**: Configuração das aulas e horários da academia.

**Campos**:
- `name` - Nome da aula
- `description` - Descrição da aula
- `instructorId` - Professor responsável (FK users)
- `dayOfWeek` - Dia da semana (0-6, Domingo-Sábado)
- `startTime` - Horário de início (formato "HH:MM")
- `duration` - Duração em minutos
- `maxCapacity` - Capacidade máxima (deprecated)
- `maxStudents` - Limite máximo de alunos (padrão: 20)

### ✅ Tabela `attendance` (Presença)
**Propósito**: Registro de presenças dos alunos nas aulas.

**Campos**:
- `studentId` - Aluno (FK students)
- `classId` - Aula (FK classes)
- `date` - Data e hora da presença
- `status` - Status da presença ('present', 'absent', 'late')
- `checkedInBy` - Quem fez o check-in (FK users)

### 📝 Tabela `attendance_changes` (Mudanças de Presença)
**Propósito**: Controle de confirmações e cancelamentos de aulas pelos alunos.

**Campos**:
- `studentId` - Aluno (FK students)
- `classId` - Aula (FK classes)
- `date` - Data da aula
- `changeType` - Tipo da mudança ('confirm' ou 'cancel')
- `createdAt` - Data da mudança

### 💳 Tabela `payment_plans` (Planos de Pagamento)
**Propósito**: Definição dos planos de mensalidade disponíveis.

**Campos**:
- `name` - Nome do plano
- `amount` - Valor em centavos
- `frequency` - Frequência ('monthly', 'quarterly', etc.)
- `description` - Descrição do plano
- `isScholarship` - Indica se é plano de bolsista

### 🧾 Tabela `student_payments` (Pagamentos dos Estudantes)
**Propósito**: Controle de mensalidades e pagamentos dos alunos.

**Campos**:
- `studentId` - Aluno (FK students)
- `planId` - Plano de pagamento (FK payment_plans)
- `status` - Status do pagamento ('paid', 'pending', 'overdue')
- `dueDate` - Data de vencimento
- `paidDate` - Data do pagamento
- `amount` - Valor em centavos
- `notes` - Observações
- `overdueAt` - Data quando ficou inadimplente

### 📋 Tabela `documents` (Documentos)
**Propósito**: Gerenciamento de documentos dos alunos.

**Campos**:
- `studentId` - Aluno (FK students)
- `documentType` - Tipo do documento (enum)
- `fileName` - Nome do arquivo no storage
- `originalFileName` - Nome original do arquivo
- `fileUrl` - URL do arquivo
- `fileSize` - Tamanho do arquivo
- `mimeType` - Tipo MIME
- `uploadedBy` - Quem fez o upload
- `notes` - Observações
- `isVerified` - Se foi verificado
- `verifiedBy` - Quem verificou
- `verifiedAt` - Quando foi verificado

### 🎯 Tabela `risk_actions` (Ações de Risco)
**Propósito**: Registro de ações tomadas para alunos em situação de risco (baixa frequência, inadimplência).

**Campos**:
- `studentId` - Aluno (FK students)
- `actionType` - Tipo da ação (call, email, whatsapp, etc.)
- `notes` - Notas sobre a ação
- `scheduledDate` - Data agendada
- `completedDate` - Data de conclusão
- `createdBy` - Quem criou a ação

### ⚙️ Tabela `risk_settings` (Configurações de Risco)
**Propósito**: Configurações para detecção de alunos em risco.

**Campos**:
- `frequencyThreshold` - Limite de frequência (%) padrão: 60%
- `daysThreshold` - Dias sem frequentar (padrão: 7)
- `autoAlerts` - Alertas automáticos habilitados

### 📊 Tabela `activity_logs` (Log de Atividades)
**Propósito**: Auditoria e histórico de ações no sistema.

**Campos**:
- `userId` - Usuário que executou a ação
- `activity` - Descrição da atividade
- `entityType` - Tipo da entidade ('student', 'class', 'payment')
- `entityId` - ID da entidade
- `timestamp` - Data e hora da ação

### 🎨 Tabela `dashboard_customizations` (Personalização do Dashboard)
**Propósito**: Preferências de personalização do dashboard por usuário.

**Campos**:
- `userId` - Usuário (FK users)
- `layout` - Layout ('default', 'compact', 'minimal')
- `theme` - Tema ('light', 'dark', 'auto')
- `widgetOrder` - Ordem dos widgets (array)
- `hiddenWidgets` - Widgets ocultos (array)
- `showWelcomeMessage` - Exibir mensagem de boas-vindas
- `compactMode` - Modo compacto
- `showQuickActions` - Exibir ações rápidas
- `backgroundColor` - Cor de fundo personalizada
- `accentColor` - Cor de destaque

### 🏆 Tabela `streak_achievements` (Conquistas de Sequência)
**Propósito**: Sistema de gamificação para logins consecutivos.

**Campos**:
- `userId` - Usuário (FK users)
- `achievementType` - Tipo ('streak', 'total_logins', 'comeback')
- `achievementName` - Nome da conquista
- `achievementDescription` - Descrição
- `streakCount` - Número da sequência
- `iconName` - Nome do ícone
- `iconColor` - Cor do ícone
- `earnedDate` - Data que ganhou
- `isDisplayed` - Se está sendo exibida

### 📅 Tabela `daily_login_records` (Registros Diários de Login)
**Propósito**: Controle detalhado dos logins diários para sistema de streak.

**Campos**:
- `userId` - Usuário (FK users)
- `loginDate` - Data do login
- `loginCount` - Quantidade de logins no dia
- `streakDay` - Dia da sequência
- `bonusPoints` - Pontos bônus ganhos

## 🔍 Views e Funções Auxiliares

### Views Criadas
1. **`students_complete`** - Alunos com informações completas (join com users)
2. **`attendance_report`** - Relatório de presenças detalhado
3. **`overdue_payments`** - Pagamentos em atraso

### Funções Importantes
1. **`calculate_attendance_rate(student_id)`** - Calcula taxa de presença
2. **`update_student_attendance_rate()`** - Atualiza automaticamente a taxa via trigger
3. **`update_updated_at_column()`** - Atualiza campo updated_at automaticamente

## 📈 Índices de Performance

```sql
-- Índices para otimização de consultas
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_belt_level ON students(belt_level);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_student_payments_student_id ON student_payments(student_id);
CREATE INDEX idx_student_payments_status ON student_payments(status);
CREATE INDEX idx_student_payments_due_date ON student_payments(due_date);
```

## 🔗 Principais Relacionamentos

1. **Users → Students** (1:1) - Usuário pode ser um estudante
2. **Users → Classes** (1:N) - Instrutor pode dar várias aulas
3. **Students → Attendance** (1:N) - Aluno tem várias presenças
4. **Classes → Attendance** (1:N) - Aula tem várias presenças
5. **Students → StudentPayments** (1:N) - Aluno tem várias mensalidades
6. **PaymentPlans → StudentPayments** (1:N) - Plano pode ter vários pagamentos
7. **Students → Documents** (1:N) - Aluno pode ter vários documentos
8. **Students → RiskActions** (1:N) - Aluno pode ter várias ações de risco

## 🚀 Triggers Automáticos

1. **Atualização de taxa de presença** - Quando nova presença é registrada
2. **Updated_at automático** - Para tabelas com controle de modificação
3. **Log de atividades** - Para auditoria de ações importantes

## 💾 Dados Iniciais

O sistema é inicializado com:
- Usuário administrador padrão
- Professor exemplo
- Planos de pagamento básicos
- Aulas/turmas exemplo
- Eventos exemplo
- Estudantes exemplo com dados de teste
- Configuração inicial da escola

Esta estrutura robusta suporta todas as funcionalidades do SenseiSystem, desde gestão básica de alunos até funcionalidades avançadas como gamificação, controle de risco e integração com gateway de pagamento.
