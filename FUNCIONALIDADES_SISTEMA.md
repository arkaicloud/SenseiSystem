
# 🥋 SenseiSystem - Funcionalidades Completas do Sistema
## Sistema de Gestão para Academias de Artes Marciais

---

## 📋 Índice

1. [Visão Geral do Sistema](#-visão-geral-do-sistema)
2. [Gerenciamento de Usuários](#-gerenciamento-de-usuários)
3. [Sistema de Matrículas](#-sistema-de-matrículas)
4. [Controle de Presenças](#-controle-de-presenças)
5. [Gestão Financeira](#-gestão-financeira)
6. [Dashboard Inteligente](#-dashboard-inteligente)
7. [Sistema de Graduações](#-sistema-de-graduações)
8. [Eventos e Comunicação](#-eventos-e-comunicação)
9. [Gamificação e Engajamento](#-gamificação-e-engajamento)
10. [Documentos e Arquivos](#-documentos-e-arquivos)
11. [Sistema de Alertas](#-sistema-de-alertas)
12. [Integração ASAAS](#-integração-asaas)
13. [Configurações da Academia](#-configurações-da-academia)
14. [Relatórios e Analytics](#-relatórios-e-analytics)
15. [Sistema Multi-Tenant](#-sistema-multi-tenant)

---

## 🎯 Visão Geral do Sistema

O **SenseiSystem** é uma plataforma SaaS completa para gestão de academias de artes marciais, especialmente focada em Jiu-Jitsu. O sistema oferece uma solução integrada que vai desde o controle básico de alunos até funcionalidades avançadas de gamificação, automação financeira e análise de dados.

### Principais Características:
- **Sistema Multi-Tenant**: Uma instância suporta múltiplas academias
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile
- **PWA Ready**: Experiência de aplicativo nativo
- **Temas Personalizáveis**: Light/Dark mode com cores customizáveis
- **Três Níveis de Acesso**: Admin, Instructor e Student

---

## 👥 Gerenciamento de Usuários

### 1.1 Níveis de Acesso

#### 🔑 Administrador (Admin)
**Acesso Total ao Sistema**
- Gestão completa de usuários (CRUD)
- Configuração da academia
- Relatórios financeiros e operacionais
- Gerenciamento de professores
- Configuração de planos de pagamento
- Controle de eventos e comunicações
- Acesso às configurações de risco
- Visualização de logs de auditoria

#### 👨‍🏫 Professor (Instructor)
**Foco em Ensino e Acompanhamento**
- Gerenciamento de suas aulas
- Controle de presença dos alunos
- Acompanhamento da evolução dos estudantes
- Graduação de faixas
- Visualização de relatórios de suas turmas
- Comunicação com alunos
- Registro de observações sobre alunos

#### 👨‍🎓 Aluno (Student)
**Experiência Personalizada**
- Dashboard pessoal com métricas
- Visualização de horários de aula
- Confirmação/cancelamento de presença
- Histórico de frequência
- Status financeiro
- Documentos pessoais
- Sistema de conquistas (gamificação)
- Comunicação com academia

### 1.2 Funcionalidades de Usuários

#### Cadastro e Onboarding
- **Fluxo de Registro Multi-Etapas**
  - Dados pessoais básicos
  - Informações de contato
  - Endereço completo
  - Contato de emergência
  - Responsável financeiro (se menor)
  - Questionário de saúde
  - Upload de documentos
  - Revisão final

- **Sistema de Aprovação**
  - Aprovação manual por administrador
  - Validação de documentos
  - Verificação de dados
  - Criação automática de cliente no ASAAS

#### Autenticação Robusta
- **Login Seguro**
  - Hash de senhas com Scrypt
  - JWT tokens com expiração
  - Controle de sessões
  - Logout automático por inatividade

- **Recuperação de Senha**
  - Reset por email
  - Tokens temporários
  - Validação de segurança
  - Nova senha criptografada

---

## 📝 Sistema de Matrículas

### 2.1 Processo de Matrícula

#### Onboarding Inteligente
- **Formulário Progressive**
  - 7 etapas bem definidas
  - Validação em tempo real
  - Salvamento automático de progresso
  - Interface mobile-friendly

- **Dados Coletados**
  - Informações pessoais completas
  - Dados de contato e endereço
  - Contato de emergência
  - Questionário de saúde detalhado
  - Avaliação física
  - Upload de documentos obrigatórios

#### Sistema de Aprovação
- **Fluxo de Aprovação**
  - Análise de documentos
  - Verificação de dados
  - Aprovação/rejeição manual
  - Notificação automática ao candidato

- **Pós-Aprovação**
  - Criação de cliente no ASAAS
  - Definição de plano de pagamento
  - Ativação completa do aluno
  - Envio de credenciais de acesso

---

## ✅ Controle de Presenças

### 3.1 Sistema de Presenças

#### Tipos de Registro
- **Present** - Presente na aula
- **Absent** - Faltou à aula
- **Late** - Chegou atrasado

#### Fluxo de Controle
1. **Confirmação Prévia**
   - Aluno pode confirmar presença até 7 dias antes
   - Sistema de capacidade por aula
   - Cancelamento com antecedência

2. **Check-in no Local**
   - Professor confirma presença física
   - Registro de horário de chegada
   - Controle de atrasos

3. **Cálculo Automático**
   - Taxa de presença atualizada em tempo real
   - Métricas mensais e anuais
   - Histórico detalhado

### 3.2 Agenda da Semana

#### Para Alunos
- **Visualização Semanal**
  - Aulas da semana atual
  - Status de confirmação
  - Horários e professores
  - Ações rápidas (confirmar/cancelar)

- **Interface Intuitiva**
  - Cards visuais por dia
  - Cores indicativas de status
  - Navegação por semanas
  - Responsivo para mobile

#### Para Professores
- **Controle de Turma**
  - Lista de alunos confirmados
  - Registro de presença rápido
  - Capacidade de cada aula
  - Histórico de frequência

---

## 💰 Gestão Financeira

### 4.1 Planos de Pagamento

#### Tipos de Planos
- **Mensais** - Cobrança mensal
- **Trimestrais** - Cobrança a cada 3 meses
- **Anuais** - Cobrança anual com desconto
- **Bolsistas** - Planos especiais/gratuitos

#### Configurações
- **Valores Personalizados**
- **Data de vencimento preferida**
- **Descontos especiais**
- **Promoções temporárias**

### 4.2 Controle de Pagamentos

#### Status de Pagamento
- **Paid** - Pago
- **Pending** - Pendente
- **Overdue** - Em atraso

#### Funcionalidades
- **Geração Automática de Cobranças**
  - Cobrança mensal automática
  - Diferentes métodos de pagamento
  - Links de pagamento por email

- **Controle de Inadimplência**
  - Alertas automáticos
  - Relatórios de cobrança
  - Ações de recuperação

### 4.3 Integração com ASAAS

#### Gateway de Pagamento
- **PIX** - Pagamento instantâneo
- **Cartão de Crédito** - Parcelamento disponível
- **Boleto Bancário** - Pagamento tradicional

#### Automação
- **Webhooks** - Atualização automática de status
- **Assinaturas** - Cobrança recorrente
- **Notificações** - Avisos por email/SMS

---

## 📊 Dashboard Inteligente

### 5.1 Dashboard Administrativo

#### Métricas Principais
- **Total de Alunos** - Ativos e inativos
- **Taxa de Presença Geral** - Média da academia
- **Receita Mensal** - Faturamento atual
- **Alunos Inadimplentes** - Em atraso
- **Aniversariantes do Mês** - Lista completa

#### Widgets Personalizáveis
- **Distribuição de Faixas** - Gráfico por níveis
- **Gráfico de Frequência** - Tendências mensais
- **Previsão Financeira** - Projeções
- **Alertas Importantes** - Ações pendentes
- **Próximos Eventos** - Agenda da academia

#### Ações Rápidas
- **Cadastro de Novo Aluno**
- **Registro de Presença**
- **Criação de Evento**
- **Envio de Comunicação**
- **Geração de Relatórios**

### 5.2 Dashboard do Professor

#### Suas Aulas
- **Horários do Dia** - Agenda pessoal
- **Lista de Alunos Confirmados**
- **Controle de Presença Rápido**
- **Histórico de Turmas**

#### Gestão de Turma
- **Evolução dos Alunos**
- **Candidatos à Graduação**
- **Estatísticas da Turma**
- **Comunicação Direcionada**

### 5.3 Dashboard do Aluno

#### Painel Pessoal
- **Próximas Aulas** - Agenda da semana
- **Frequência Mensal** - Taxa atual
- **Status da Mensalidade** - Situação financeira
- **Conquistas Desbloqueadas** - Gamificação
- **Mensagens da Academia** - Comunicados

#### Métricas Pessoais
- **Streak de Login** - Dias consecutivos
- **Total de Aulas** - Histórico completo
- **Evolução da Faixa** - Progresso visual
- **Documentos** - Status de verificação

---

## 🥋 Sistema de Graduações

### 6.1 Níveis de Faixa

#### Faixas do Jiu-Jitsu
- **Branca** (White) - Iniciante
- **Azul** (Blue) - Iniciante avançado
- **Roxa** (Purple) - Intermediário
- **Marrom** (Brown) - Avançado
- **Preta** (Black) - Expert

#### Sistema de Listras
- **0 a 4 listras por faixa**
- **Controle de evolução**
- **Histórico de graduações**
- **Certificados digitais**

### 6.2 Controle de Evolução

#### Graduação de Alunos
- **Promoção de Faixa** - Mudança de nível
- **Adição de Listras** - Progressão dentro do nível
- **Data de Promoção** - Histórico completo
- **Critérios de Avaliação** - Frequência e desempenho

#### Avatar Personalizado
- **Cores Customizáveis** - Personalização visual
- **Estilos Diferentes** - Opções visuais
- **Representação da Faixa** - Indicação visual do nível
- **Upload de Foto** - Avatar pessoal

---

## 🎉 Eventos e Comunicação

### 7.1 Gestão de Eventos

#### Tipos de Eventos
- **Campeonatos Internos** - Competições da academia
- **Seminários Especiais** - Workshops técnicos
- **Graduações** - Cerimônias de faixa
- **Confraternizações** - Eventos sociais

#### Funcionalidades
- **Criação Simples** - Interface intuitiva
- **Gestão de Participantes** - Lista de interessados
- **Comunicação** - Avisos automáticos
- **Documentação** - Fotos e relatórios

### 7.2 Sistema de Comunicação

#### Canais Disponíveis
- **Notificações In-App** - Avisos no sistema
- **Email Marketing** - Campanhas por email
- **WhatsApp Business** - Mensagens diretas
- **Portal de Avisos** - Mural da academia

#### Tipos de Comunicação
- **Avisos Gerais** - Para toda academia
- **Comunicação Segmentada** - Por faixa/turma
- **Mensagens Individuais** - Aluno específico
- **Alertas Automáticos** - Notificações do sistema

---

## 🎮 Gamificação e Engajamento

### 8.1 Sistema de Conquistas

#### Login Streaks
- **Dias Consecutivos** - Sequência de logins
- **Marcos Especiais** - 7, 30, 100 dias
- **Recompensas Visuais** - Badges colecionáveis
- **Rankings Mensais** - Competição saudável

#### Tipos de Conquistas
- **Guerreiro Semanal** - 7 dias consecutivos
- **Samurai Mensal** - 30 dias consecutivos
- **Centurião** - 100 logins totais
- **Fiel Seguidor** - Login após ausência

### 8.2 Sistema de Pontuação

#### Pontos por Atividade
- **Login Diário** - Pontos base
- **Presença Confirmada** - Pontos extras
- **Presença Efetiva** - Pontos premium
- **Marcos de Frequência** - Bônus especiais

#### Elementos de Jogo
- **Badges Colecionáveis** - Conquistas visuais
- **Níveis de Experiência** - Progressão gamificada
- **Desafios Mensais** - Metas coletivas
- **Hall da Fama** - Melhores alunos

---

## 📁 Documentos e Arquivos

### 9.1 Sistema de Upload

#### Tipos de Documentos
- **Atestados Médicos** - Documentos de saúde
- **Certificados de Graduação** - Comprovantes de faixa
- **Formulários de Saúde** - Questionários preenchidos
- **Documentos Pessoais** - RG, CPF, etc.
- **Contratos** - Termos de matrícula
- **Outros** - Documentos diversos

#### Funcionalidades
- **Upload Seguro** - Múltiplos formatos
- **Validação Automática** - Verificação de tipos
- **Organização Automática** - Por categoria
- **Controle de Versões** - Histórico de uploads
- **Backup Automático** - Segurança dos dados

### 9.2 Gestão de Arquivos

#### Verificação de Documentos
- **Status de Verificação** - Pendente/Verificado
- **Aprovação Manual** - Por administrador
- **Notificações** - Avisos de status
- **Histórico** - Log de verificações

---

## ⚠️ Sistema de Alertas

### 10.1 Detecção de Risco

#### Alunos em Risco
- **Baixa Frequência** - Menos de 60% de presença
- **Ausência Prolongada** - Mais de 7 dias sem aparecer
- **Inadimplência** - Pagamentos em atraso
- **Padrões Comportamentais** - Análise automática

#### Algoritmos Inteligentes
- **Machine Learning** - Previsão de evasão
- **Alertas Preditivos** - Ação preventiva
- **Segmentação Automática** - Classificação de risco
- **Ações Sugeridas** - Estratégias de retenção

### 10.2 Ações de Retenção

#### Fluxo Estruturado
1. **Identificação** - Sistema detecta risco
2. **Alerta** - Notificação para administrador
3. **Ação** - Ligação, email ou visita
4. **Acompanhamento** - Follow-up das ações
5. **Resultado** - Análise de efetividade

#### Tipos de Ação
- **Ligação Telefônica** - Contato direto
- **Email Personalizado** - Mensagem customizada
- **WhatsApp** - Mensagem rápida
- **Visita Pessoal** - Abordagem presencial
- **Desconto Especial** - Incentivo financeiro

---

## 💳 Integração ASAAS

### 11.1 Gateway de Pagamento

#### Métodos Disponíveis
- **PIX** - Pagamento instantâneo
- **Cartão de Crédito** - Com parcelamento
- **Boleto Bancário** - Pagamento tradicional
- **Transferência** - TED/DOC

#### Funcionalidades
- **Cobrança Automática** - Mensalidades recorrentes
- **Links de Pagamento** - Envio por email/SMS
- **Parcelamento** - Opções flexíveis
- **Juros e Multas** - Configuráveis

### 11.2 Automação Financeira

#### Webhooks Automáticos
- **Pagamento Confirmado** - Atualização automática
- **Pagamento Vencido** - Alertas de cobrança
- **Falha no Pagamento** - Notificação de erro
- **Cancelamento** - Gestão de cancelamentos

#### Sincronização
- **Status em Tempo Real** - Atualização instantânea
- **Reconciliação** - Verificação de dados
- **Relatórios Integrados** - Visão unificada
- **Backup de Transações** - Segurança dos dados

---

## ⚙️ Configurações da Academia

### 12.1 Personalização Visual

#### Identidade da Marca
- **Nome da Academia** - Branding personalizado
- **Logo Customizado** - Upload de logotipo
- **Cores da Marca** - Paleta personalizada
- **Temas** - Light/Dark mode

#### Interface
- **Layout Adaptável** - Desktop e mobile
- **Tipografia** - Fontes personalizáveis
- **Ícones** - Biblioteca extensiva
- **Animações** - Transições suaves

### 12.2 Configurações Operacionais

#### Parâmetros do Sistema
- **Antecedência para Aulas** - Máximo 7 dias
- **Capacidade por Aula** - Limite de alunos
- **Horários de Funcionamento** - Agenda da academia
- **Feriados** - Calendário customizado

#### Mensagens Personalizadas
- **Mensagem de Boas-vindas** - Para novos alunos
- **Avisos Padrão** - Templates de comunicação
- **Textos de Parabéns** - Para graduações
- **Termos de Uso** - Documentos legais

---

## 📈 Relatórios e Analytics

### 13.1 Relatórios Operacionais

#### Frequência
- **Taxa de Presença por Período** - Mensal/anual
- **Frequência por Faixa** - Análise por nível
- **Evolução da Frequência** - Tendências
- **Alunos por Aula** - Ocupação das turmas

#### Evolução de Alunos
- **Graduações por Período** - Progressão
- **Tempo por Faixa** - Análise de permanência
- **Candidatos à Graduação** - Lista de elegíveis
- **Histórico Completo** - Evolução individual

### 13.2 Relatórios Financeiros

#### Receita
- **Faturamento Mensal** - Receita recorrente
- **Projeção Anual** - Planejamento financeiro
- **Receita por Plano** - Análise de produtos
- **Growth Rate** - Taxa de crescimento

#### Inadimplência
- **Alunos em Atraso** - Lista detalhada
- **Taxa de Inadimplência** - Percentual
- **Ações de Cobrança** - Efetividade
- **Recuperação** - Taxa de sucesso

### 13.3 Analytics Avançados

#### KPIs Principais
- **Taxa de Retenção** - Permanência de alunos
- **Lifetime Value (LTV)** - Valor vitalício
- **Cost per Acquisition (CAC)** - Custo de aquisição
- **Net Promoter Score (NPS)** - Satisfação

#### Análise Preditiva
- **Previsão de Evasão** - Machine Learning
- **Otimização de Horários** - Análise de ocupação
- **Segmentação de Alunos** - Perfis comportamentais
- **Forecast Financeiro** - Projeções inteligentes

---

## 🏢 Sistema Multi-Tenant

### 14.1 Arquitetura SaaS

#### Modelo de Negócio
- **Uma Instância** - Múltiplas academias
- **Isolamento de Dados** - Segurança por tenant
- **Configurações Individuais** - Por academia
- **Escalabilidade** - Crescimento automático

#### Gestão de Tenants
- **Cadastro de Academias** - Onboarding simples
- **Configuração Individual** - Personalização completa
- **Backup Isolado** - Segurança de dados
- **Monitoramento** - Métricas por tenant

### 14.2 Planos SaaS

#### Cobrança da Plataforma
- **Plano Mensal** - Assinatura recorrente
- **Período Trial** - Teste gratuito
- **Cobrança Automática** - Via ASAAS
- **Suspensão** - Por inadimplência

#### Funcionalidades por Plano
- **Básico** - Funcionalidades essenciais
- **Premium** - Recursos avançados
- **Enterprise** - Customizações especiais
- **White Label** - Marca própria

---

## 🛡️ Segurança e Compliance

### 15.1 Segurança de Dados

#### Proteção
- **Criptografia End-to-End** - Dados protegidos
- **LGPD Compliance** - Lei de proteção
- **Backup Automático** - Recuperação de dados
- **Logs de Auditoria** - Rastreabilidade completa

#### Controle de Acesso
- **Autenticação JWT** - Tokens seguros
- **Níveis de Permissão** - Acesso granular
- **Sessões Controladas** - Timeout automático
- **Proteção contra Ataques** - Medidas preventivas

### 15.2 Monitoramento

#### Performance
- **Métricas de Sistema** - CPU, RAM, Storage
- **Tempo de Resposta** - Latência das APIs
- **Uptime** - Disponibilidade do serviço
- **Logs de Erro** - Detecção de problemas

#### Qualidade
- **Testes Automatizados** - Validação contínua
- **Code Review** - Qualidade do código
- **Documentation** - Documentação completa
- **Versionamento** - Controle de releases

---

## 🚀 Tecnologias Utilizadas

### Stack Principal
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL (Neon Database)
- **ORM**: Drizzle ORM
- **Autenticação**: Passport.js + JWT + Scrypt
- **Pagamentos**: Integração ASAAS
- **Hospedagem**: Replit

### Ferramentas de Desenvolvimento
- **Versionamento**: Git + GitHub
- **Deploy**: Replit Deployments
- **Monitoramento**: Logs integrados
- **Testes**: Testes automatizados
- **Documentação**: Markdown + Diagramas

---

## 📱 PWA e Mobile

### Progressive Web App
- **Instalável** - Como aplicativo nativo
- **Offline First** - Funciona sem internet
- **Push Notifications** - Notificações nativas
- **Responsive Design** - Adaptável a qualquer tela

### Funcionalidades Mobile
- **Touch Friendly** - Interface otimizada para toque
- **Navegação Gestual** - Swipe e gestos
- **Camera Integration** - Upload de fotos direto
- **Geolocalização** - Recursos baseados em localização

---

## 📊 Resumo de Funcionalidades

### ✅ Implementado e Funcional
- Gestão completa de usuários (Admin, Professor, Aluno)
- Sistema de onboarding com 7 etapas
- Dashboard inteligente com métricas em tempo real
- Controle de presenças com confirmação prévia
- Sistema financeiro com integração ASAAS
- Gamificação com login streaks e conquistas
- Upload e gestão de documentos
- Sistema de graduações e faixas
- Detecção automática de alunos em risco
- Configuração personalizada por academia
- Interface responsiva e PWA ready
- Temas personalizáveis (Light/Dark)
- Sistema multi-tenant
- Integração com gateway de pagamento
- Relatórios operacionais e financeiros

### 🔄 Em Desenvolvimento Contínuo
- Analytics avançados com IA
- Sistema de comunicação integrado
- Marketplace de produtos
- App mobile nativo
- Integração com wearables
- Sistema de coaching personalizado

O SenseiSystem representa uma solução completa e moderna para gestão de academias de artes marciais, combinando eficiência operacional, experiência do usuário excepcional e tecnologia de ponta para impulsionar o sucesso das academias parceiras.
