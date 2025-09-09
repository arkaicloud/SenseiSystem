
# 📋 Manual Técnico Completo - SenseiSystem
## Sistema de Gestão para Academias de Artes Marciais

---

## 📑 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Banco de Dados](#banco-de-dados)
4. [Backend (API)](#backend-api)
5. [Frontend](#frontend)
6. [Funcionalidades Detalhadas](#funcionalidades-detalhadas)
7. [Integração ASAAS](#integração-asaas)
8. [Sistema de Autenticação](#sistema-de-autenticação)
9. [Upload de Arquivos](#upload-de-arquivos)
10. [Configurações e Variáveis](#configurações-e-variáveis)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## 1. Visão Geral do Sistema

### 1.1 Propósito
O **SenseiSystem** é um SaaS (Software as a Service) completo para gestão de academias de artes marciais, especialmente focado em Jiu-Jitsu. O sistema oferece:

- Gestão completa de alunos
- Controle de presenças e aulas
- Sistema financeiro integrado
- Gamificação e engajamento
- Painel administrativo avançado
- Sistema multi-tenant (uma instância, múltiplas academias)

### 1.2 Tecnologias Principais
```
Frontend: React 18 + TypeScript + Vite + Tailwind CSS
Backend: Node.js + Express + TypeScript
Banco: PostgreSQL (Neon Database)
ORM: Drizzle ORM
Autenticação: Passport.js + JWT + Scrypt
Hosting: Replit
Gateway: ASAAS (Pagamentos)
```

---

## 2. Arquitetura Técnica

### 2.1 Estrutura do Projeto
```
├── client/                 # Frontend React
├── server/                 # Backend Node.js
├── shared/                 # Tipos e utilitários compartilhados
├── docs/                   # Documentação
└── onboarding/            # Componentes de cadastro
```

### 2.2 Fluxo de Comunicação
```
[Frontend] → [API Routes] → [Services] → [Database]
     ↓           ↑              ↓          ↑
[Components] ← [Auth] ← [Middleware] ← [ORM]
```

### 2.3 Padrões Arquiteturais
- **Multi-Tenant**: Cada academia é um tenant separado
- **RESTful API**: Endpoints padronizados
- **Component-Based**: Componentes reutilizáveis
- **Service Layer**: Lógica de negócio separada
- **Middleware Pipeline**: Autenticação e validação

---

## 3. Banco de Dados

### 3.1 Tecnologia
- **PostgreSQL** via Neon Database (serverless)
- **Drizzle ORM** para queries type-safe
- **Migrações automáticas** via schema

### 3.2 Estrutura Principal

#### 3.2.1 Tabela `users` (Usuários Base)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    phone TEXT,
    emergency_contact TEXT,
    birth_date TIMESTAMP,
    -- Endereço completo
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    -- Controle de sistema
    join_date TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending',
    -- Sistema de Streak
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_login_date TIMESTAMP,
    total_logins INTEGER DEFAULT 0
);
```

#### 3.2.2 Tabela `students` (Alunos)
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    belt_level belt_level NOT NULL DEFAULT 'white',
    stripes INTEGER DEFAULT 0,
    last_promotion_date TIMESTAMP,
    attendance_rate INTEGER DEFAULT 0,
    notes TEXT,
    -- Avatar personalizado
    avatar_color TEXT DEFAULT '#3b82f6',
    avatar_style TEXT DEFAULT 'initials',
    avatar_image TEXT,
    -- Responsável financeiro
    financial_responsible_name TEXT,
    financial_responsible_email TEXT,
    financial_responsible_phone TEXT,
    financial_responsible_cpf TEXT,
    financial_responsible_relation TEXT,
    -- Integração ASAAS
    asaas_customer_id TEXT,
    asaas_subscription_id TEXT,
    -- Configurações de pagamento
    payment_plan_id INTEGER REFERENCES payment_plans(id),
    preferred_due_date INTEGER DEFAULT 10
);
```

#### 3.2.3 Tabela `classes` (Aulas)
```sql
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(id),
    day_of_week INTEGER NOT NULL, -- 0-6 (Domingo-Sábado)
    start_time TEXT NOT NULL,     -- "HH:MM"
    duration INTEGER NOT NULL,    -- minutos
    max_students INTEGER DEFAULT 20
);
```

#### 3.2.4 Tabela `attendance` (Presenças)
```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    date TIMESTAMP NOT NULL DEFAULT NOW(),
    status attendance_status NOT NULL DEFAULT 'present',
    checked_in_by INTEGER REFERENCES users(id)
);
```

#### 3.2.5 Tabela `student_payments` (Pagamentos)
```sql
CREATE TABLE student_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    plan_id INTEGER REFERENCES payment_plans(id),
    status payment_status NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP NOT NULL,
    paid_date TIMESTAMP,
    amount INTEGER NOT NULL, -- centavos
    asaas_payment_id TEXT,
    asaas_invoice_url TEXT,
    notes TEXT,
    overdue_at TIMESTAMP
);
```

### 3.3 ENUMs do Sistema
```sql
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE belt_level AS ENUM ('white', 'blue', 'purple', 'brown', 'black');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'overdue');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE document_type AS ENUM ('health_form', 'graduation_certificate', 'medical_certificate', 'identification', 'contract', 'other');
```

### 3.4 Índices de Performance
```sql
-- Índices principais para otimização
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_student_payments_status ON student_payments(status);
```

---

## 4. Backend (API)

### 4.1 Estrutura do Servidor
```typescript
// server/index.ts - Ponto de entrada
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { setupRoutes } from './routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

setupRoutes(app);
```

### 4.2 Principais Endpoints

#### 4.2.1 Autenticação
```typescript
POST /api/login          // Login de usuário
POST /api/logout         // Logout
GET  /api/user           // Dados do usuário logado
POST /api/forgot-password // Solicitar reset de senha
POST /api/reset-password  // Confirmar reset de senha
```

#### 4.2.2 Gestão de Alunos
```typescript
GET    /api/students           // Listar alunos
POST   /api/students           // Criar aluno
GET    /api/students/:id       // Buscar aluno específico
PATCH  /api/students/:id       // Atualizar aluno
DELETE /api/students/:id       // Remover aluno
POST   /api/students/:id/promote // Promover faixa
```

#### 4.2.3 Presenças
```typescript
GET  /api/attendance           // Listar presenças
POST /api/attendance           // Registrar presença
GET  /api/attendance/student/:id // Presenças de um aluno
POST /api/attendance/confirm   // Confirmar presença antecipada
```

#### 4.2.4 Sistema Financeiro
```typescript
GET  /api/financial-stats      // Estatísticas financeiras
GET  /api/student-payments     // Listar pagamentos
POST /api/student-payments     // Criar cobrança
GET  /api/payment-plans        // Planos disponíveis
```

#### 4.2.5 Dashboard
```typescript
GET /api/dashboard/metrics     // Métricas principais
GET /api/dash/admin           // Dashboard administrativo
GET /api/dash/student         // Dashboard do aluno
```

### 4.3 Middleware de Autenticação
```typescript
// server/auth.ts
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

### 4.4 Serviços Principais

#### 4.4.1 Dashboard Metrics Service
```typescript
// server/services/dashboardMetrics.ts
export async function getDashboardMetrics() {
  const totalStudents = await db.select({ count: sql`count(*)` })
    .from(students)
    .where(eq(users.active, true));

  const activeStudents = await db.select({ count: sql`count(*)` })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(and(eq(users.active, true), eq(users.status, 'active')));

  // ... mais métricas
}
```

#### 4.4.2 ASAAS Integration Service
```typescript
// server/services/asaasService.ts
export class AsaasService {
  private apiKey: string;
  private baseUrl: string;

  async createCustomer(customerData: any) {
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });
    return response.json();
  }

  async createPayment(paymentData: any) {
    // Implementação de cobrança
  }
}
```

---

## 5. Frontend

### 5.1 Estrutura Principal
```
client/src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas da aplicação
├── hooks/         # Custom hooks
├── lib/           # Utilitários e configurações
├── providers/     # Provedores de contexto
└── types/         # Definições de tipos
```

### 5.2 Principais Componentes

#### 5.2.1 Dashboard Administrativo
```typescript
// client/src/pages/dashboard/admin.tsx
export default function AdminDashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get('/dashboard/metrics')
  });

  return (
    <div className="space-y-6">
      <StatCard title="Total de Alunos" value={metrics?.totalStudents} />
      <BeltDistribution data={metrics?.beltDistribution} />
      <FinancialCard stats={metrics?.financialStats} />
    </div>
  );
}
```

#### 5.2.2 Onboarding de Alunos
```typescript
// client/src/components/onboarding/StudentOnboarding.tsx
export default function StudentOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({});

  const steps = [
    PersonalInfoStep,
    ContactInfoStep,
    AddressStep,
    ResponsiblePartyStep,
    HealthFormStep,
    DocumentsStep,
    ReviewStep
  ];

  const StepComponent = steps[currentStep];

  return (
    <div className="min-h-screen bg-slate-50">
      <ProgressBar current={currentStep} total={steps.length} />
      <StepComponent
        data={formData}
        onUpdate={setFormData}
        onNext={() => setCurrentStep(currentStep + 1)}
        onPrev={() => setCurrentStep(currentStep - 1)}
      />
    </div>
  );
}
```

### 5.3 Gerenciamento de Estado
```typescript
// client/src/hooks/use-auth.tsx
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.post('/login', credentials);
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, login, logout, loading };
}
```

### 5.4 Sistema de Temas
```typescript
// client/src/lib/theme.tsx
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

## 6. Funcionalidades Detalhadas

### 6.1 Sistema de Usuários

#### 6.1.1 Níveis de Acesso
```typescript
enum UserRole {
  ADMIN = 'admin',        // Acesso total
  INSTRUCTOR = 'instructor', // Gestão de aulas
  STUDENT = 'student'     // Painel pessoal
}
```

#### 6.1.2 Fluxo de Cadastro
1. **Onboarding** → Dados pessoais
2. **Aprovação Admin** → Validação manual
3. **Ativação** → Criação de cliente ASAAS
4. **Dashboard** → Acesso liberado

### 6.2 Sistema de Presenças

#### 6.2.1 Tipos de Presença
```typescript
enum AttendanceStatus {
  PRESENT = 'present',   // Presente
  ABSENT = 'absent',     // Faltou
  LATE = 'late'         // Atrasado
}
```

#### 6.2.2 Fluxo de Controle
1. **Confirmação Prévia** → Aluno confirma até 7 dias antes
2. **Check-in Local** → Professor confirma presença
3. **Cálculo Automático** → Taxa de presença atualizada
4. **Alertas de Risco** → Detecção de baixa frequência

### 6.3 Sistema Financeiro

#### 6.3.1 Planos de Pagamento
```typescript
interface PaymentPlan {
  id: number;
  name: string;
  amount: number;        // centavos
  frequency: string;     // 'monthly', 'quarterly'
  description: string;
  isScholarship: boolean;
}
```

#### 6.3.2 Integração ASAAS
```typescript
// Fluxo de cobrança
const createPayment = async (studentId: number, planId: number) => {
  // 1. Buscar cliente ASAAS do aluno
  const student = await getStudent(studentId);
  
  // 2. Criar cobrança no ASAAS
  const asaasPayment = await asaasService.createPayment({
    customer: student.asaasCustomerId,
    billingType: 'PIX',
    value: plan.amount / 100,
    dueDate: calculateDueDate(student.preferredDueDate)
  });
  
  // 3. Salvar no banco local
  await createStudentPayment({
    studentId,
    planId,
    asaasPaymentId: asaasPayment.id,
    amount: plan.amount,
    dueDate: asaasPayment.dueDate,
    status: 'pending'
  });
};
```

### 6.4 Sistema de Gamificação

#### 6.4.1 Login Streaks
```typescript
interface StreakData {
  currentStreak: number;    // Sequência atual
  longestStreak: number;    // Maior sequência
  lastLoginDate: Date;      // Último login
  totalLogins: number;      // Total de logins
}
```

#### 6.4.2 Conquistas
```typescript
const achievements = [
  { type: 'streak', count: 7, name: 'Guerreiro Semanal' },
  { type: 'streak', count: 30, name: 'Samurai Mensal' },
  { type: 'total_logins', count: 100, name: 'Centurião' }
];
```

### 6.5 Sistema de Documentos

#### 6.5.1 Upload Seguro
```typescript
// server/services/uploadService.ts
export const uploadDocument = async (file: Express.Multer.File, studentId: number) => {
  const fileName = `${studentId}_${Date.now()}_${file.originalname}`;
  const uploadPath = path.join(UPLOAD_DIR, fileName);
  
  await fs.promises.writeFile(uploadPath, file.buffer);
  
  return {
    fileName,
    originalFileName: file.originalname,
    fileUrl: `/uploads/${fileName}`,
    fileSize: file.size,
    mimeType: file.mimetype
  };
};
```

### 6.6 Sistema de Risco

#### 6.6.1 Detecção Automática
```typescript
const detectRiskStudents = async () => {
  const riskSettings = await getRiskSettings();
  
  const studentsAtRisk = await db.select()
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .where(
      or(
        lt(students.attendanceRate, riskSettings.frequencyThreshold),
        sql`CURRENT_DATE - MAX(attendance.date) > ${riskSettings.daysThreshold}`
      )
    );
    
  return studentsAtRisk;
};
```

---

## 7. Integração ASAAS

### 7.1 Configuração
```typescript
// server/services/asaasService.ts
class AsaasService {
  private apiKey = process.env.ASAAS_API_KEY;
  private environment = process.env.ASAAS_ENV; // 'sandbox' | 'production'
  private baseUrl = this.environment === 'production' 
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';
}
```

### 7.2 Webhook de Pagamentos
```typescript
// Receber notificações do ASAAS
app.post('/api/asaas/webhook', async (req, res) => {
  const { event, payment } = req.body;
  
  switch (event) {
    case 'PAYMENT_CONFIRMED':
      await updatePaymentStatus(payment.externalReference, 'paid');
      break;
    case 'PAYMENT_OVERDUE':
      await updatePaymentStatus(payment.externalReference, 'overdue');
      break;
  }
  
  res.status(200).send('OK');
});
```

### 7.3 Criação de Cliente
```typescript
const createAsaasCustomer = async (student: Student) => {
  const customerData = {
    name: `${student.firstName} ${student.lastName}`,
    email: student.email,
    phone: student.phone,
    mobilePhone: student.phone,
    cpfCnpj: student.financialResponsibleCpf,
    postalCode: student.zipCode,
    address: student.street,
    addressNumber: student.number,
    complement: student.complement,
    province: student.neighborhood,
    city: student.city,
    state: student.state
  };
  
  return await asaasService.createCustomer(customerData);
};
```

---

## 8. Sistema de Autenticação

### 8.1 Hash de Senhas
```typescript
// Usando scrypt para segurança
import { scrypt, randomBytes } from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(32);
  const derivedKey = scrypt(password, salt, 64);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const [salt, key] = hash.split(':');
  const derivedKey = scrypt(password, Buffer.from(salt, 'hex'), 64);
  return derivedKey.toString('hex') === key;
};
```

### 8.2 JWT Tokens
```typescript
// Geração de tokens
export const generateJWT = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};
```

### 8.3 Middleware de Autorização
```typescript
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
};
```

---

## 9. Upload de Arquivos

### 9.1 Configuração Multer
```typescript
// server/middleware/uploadMiddleware.ts
import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});
```

### 9.2 Endpoint de Upload
```typescript
app.post('/api/students/:id/documents', 
  authenticateJWT,
  upload.single('document'),
  async (req, res) => {
    const { id } = req.params;
    const { documentType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }
    
    const document = await uploadService.saveDocument(req.file, parseInt(id), documentType);
    res.json(document);
  }
);
```

---

## 10. Configurações e Variáveis

### 10.1 Variáveis de Ambiente
```bash
# .env
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secret-key
ASAAS_API_KEY=your-asaas-api-key
ASAAS_ENV=sandbox
NODE_ENV=development
PORT=5000
UPLOAD_DIR=./uploads
```

### 10.2 Configuração do Banco
```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### 10.3 Configuração de CORS
```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com']
    : ['http://localhost:5173'],
  credentials: true
}));
```

---

## 11. Deployment

### 11.1 Replit Configuration
```toml
# .replit
[deployment]
run = ["sh", "-c", "npm run dev"]

[env]
REPLIT_KEEP_PACKAGE_DEV_DEPENDENCIES = "1"

[nix]
channel = "stable-22_11"

[gitHubImport]
requiredFiles = [".replit", "replit.nix", ".config"]

[[ports]]
localPort = 5000
externalPort = 80
```

### 11.2 Build Process
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "tsc && vite build",
    "start": "NODE_ENV=production node dist/server/index.js"
  }
}
```

### 11.3 Database Migration
```typescript
// Executar migrações
npm run db:migrate

// Reset database (desenvolvimento)
npm run db:reset

// Seed inicial
npm run db:seed
```

---

## 12. Troubleshooting

### 12.1 Problemas Comuns

#### Database Connection Issues
```typescript
// Verificar conexão
const testConnection = async () => {
  try {
    const result = await db.select().from(users).limit(1);
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
};
```

#### ASAAS Integration Issues
```typescript
// Verificar configuração ASAAS
const testAsaasConnection = async () => {
  try {
    const response = await asaasService.getBalance();
    console.log('✅ ASAAS connection successful');
  } catch (error) {
    console.error('❌ ASAAS connection failed:', error);
  }
};
```

#### Upload Issues
```bash
# Verificar permissões de diretório
chmod 755 uploads/
chown www-data:www-data uploads/
```

### 12.2 Logs de Debug
```typescript
// Habilitar logs detalhados
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}
```

### 12.3 Performance Monitoring
```typescript
// Middleware de tempo de resposta
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});
```

---

## 📊 Resumo Técnico

### Stack Completa:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Passport.js + JWT + Scrypt
- **Payments**: ASAAS Integration
- **Hosting**: Replit

### Funcionalidades Principais:
- ✅ Gestão completa de alunos
- ✅ Sistema de presenças
- ✅ Dashboard administrativo
- ✅ Integração financeira (ASAAS)
- ✅ Gamificação (streaks)
- ✅ Upload de documentos
- ✅ Sistema multi-tenant
- ✅ Autenticação robusta
- ✅ Design responsivo

### Performance:
- 📊 Queries otimizadas com índices
- 🚀 React Query para cache
- 💾 Drizzle ORM type-safe
- 🔒 Middleware de segurança
- 📱 PWA-ready

Este manual técnico fornece uma visão completa e detalhada de todo o sistema SenseiSystem, servindo como referência para desenvolvedores e administradores.
