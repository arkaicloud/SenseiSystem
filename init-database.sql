
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'instructor', 'student')) NOT NULL,
    active BOOLEAN DEFAULT true,
    phone VARCHAR(20),
    emergency_contact VARCHAR(255),
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    complement VARCHAR(255),
    join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de estudantes
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    belt_level VARCHAR(20) CHECK (belt_level IN ('white', 'blue', 'purple', 'brown', 'black')) DEFAULT 'white',
    stripes INTEGER DEFAULT 0,
    last_promotion_date DATE,
    attendance_rate DECIMAL(5,2),
    notes TEXT,
    avatar_color VARCHAR(50),
    avatar_style VARCHAR(50),
    avatar_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de aulas
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(id),
    day_of_week VARCHAR(20),
    start_time TIME NOT NULL,
    end_time TIME,
    duration INTEGER DEFAULT 60,
    max_students INTEGER,
    is_active BOOLEAN DEFAULT true,
    belt_requirements VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de presença
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
    checked_in_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de planos de pagamento
CREATE TABLE IF NOT EXISTS payment_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL, -- em centavos
    frequency VARCHAR(20) CHECK (frequency IN ('monthly', 'quarterly', 'yearly')) DEFAULT 'monthly',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pagamentos de estudantes
CREATE TABLE IF NOT EXISTS student_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES payment_plans(id),
    amount INTEGER NOT NULL, -- em centavos
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de atividade
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    activity TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de eventos da escola
CREATE TABLE IF NOT EXISTS school_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações da escola
CREATE TABLE IF NOT EXISTS school_config (
    id SERIAL PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    congrats_message TEXT,
    default_theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de personalização do dashboard
CREATE TABLE IF NOT EXISTS dashboard_customization (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    layout VARCHAR(50) DEFAULT 'default',
    theme VARCHAR(20) DEFAULT 'light',
    widget_order TEXT[], -- array de strings
    hidden_widgets TEXT[], -- array de strings
    show_welcome_message BOOLEAN DEFAULT true,
    compact_mode BOOLEAN DEFAULT false,
    show_quick_actions BOOLEAN DEFAULT true,
    background_color VARCHAR(50) DEFAULT '#ffffff',
    accent_color VARCHAR(50) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir dados iniciais
-- Note: Admin user should be created through the application's registration process
-- with proper password hashing, not hardcoded in database initialization files

-- Planos de pagamento padrão
INSERT INTO payment_plans (name, description, amount, frequency) VALUES
('Plano Básico', 'Acesso a todas as aulas básicas', 15000, 'monthly'),
('Plano Premium', 'Acesso completo + aulas particulares', 25000, 'monthly'),
('Plano Anual', 'Plano anual com desconto', 150000, 'yearly')
ON CONFLICT DO NOTHING;

-- Configuração inicial da escola
INSERT INTO school_config (school_name, congrats_message) VALUES
('Academia de Jiu-Jitsu', '🏆 Parabéns!\nVocê acaba de conquistar a sua {beltName}!\n\nQue Deus continue fortalecendo sua fé e determinação nessa jornada.\n\n"Tudo posso naquele que me fortalece."\n(Filipenses 4:13)\n\nOSS!')
ON CONFLICT DO NOTHING;

-- Aulas de exemplo
INSERT INTO classes (name, description, start_time, day_of_week, duration, is_active) VALUES
('Fundamentals', 'Aula básica de fundamentos', '19:00:00', 'monday', 60, true),
('Advanced', 'Aula avançada', '20:00:00', 'wednesday', 90, true),
('Competition', 'Treino para competição', '18:00:00', 'friday', 120, true)
ON CONFLICT DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_student_payments_student ON student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
