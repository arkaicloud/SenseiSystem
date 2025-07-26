-- ==================================================
-- SENSEISYSTEM - ESTRUTURA COMPLETA DO BANCO DE DADOS
-- Sistema de Gestão para Academia de Jiu-Jitsu
-- ==================================================

-- Remover banco se existir (apenas para desenvolvimento)
-- DROP DATABASE IF EXISTS senseisystem;

-- Criar banco de dados
-- CREATE DATABASE senseisystem;
-- \c senseisystem;

-- ==================================================
-- EXTENSÕES
-- ==================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================
-- TIPOS ENUMERADOS (ENUMs)
-- ==================================================

-- Enum para tipos de usuário
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');

-- Enum para níveis de faixa
CREATE TYPE belt_level AS ENUM ('white', 'blue', 'purple', 'brown', 'black');

-- Enum para status de pagamento
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'overdue');

-- Enum para status de presença
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');

-- ==================================================
-- TABELAS PRINCIPAIS
-- ==================================================

-- Tabela de usuários (base para todos os tipos de usuário)
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
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    join_date TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);

-- Tabela de estudantes (especialização da tabela users)
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    belt_level belt_level NOT NULL DEFAULT 'white',
    stripes INTEGER DEFAULT 0,
    last_promotion_date TIMESTAMP,
    attendance_rate INTEGER DEFAULT 0,
    notes TEXT,
    avatar_color TEXT DEFAULT '#3b82f6',
    avatar_style TEXT DEFAULT 'initials',
    avatar_image TEXT
);

-- Tabela de configuração da escola
CREATE TABLE school_config (
    id SERIAL PRIMARY KEY,
    school_name TEXT NOT NULL DEFAULT 'Academia de Jiu-Jitsu',
    congrats_message TEXT NOT NULL DEFAULT '🏆 Parabéns!
Você acaba de conquistar a sua {beltName}!

Que Deus continue fortalecendo sua fé e determinação nessa jornada.

"Tudo posso naquele que me fortalece."
(Filipenses 4:13)

OSS!',
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    default_theme TEXT NOT NULL DEFAULT 'light',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de eventos da escola
CREATE TABLE school_events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMP NOT NULL,
    location TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true
);

-- Tabela de aulas/turmas
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    instructor_id INTEGER REFERENCES users(id),
    day_of_week INTEGER NOT NULL, -- 0-6 (Domingo-Sábado)
    start_time TEXT NOT NULL, -- Formato "HH:MM"
    duration INTEGER NOT NULL, -- Duração em minutos
    max_capacity INTEGER
);

-- Tabela de presença
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT NOW(),
    status attendance_status NOT NULL DEFAULT 'present',
    checked_in_by INTEGER REFERENCES users(id)
);

-- Tabela de planos de pagamento
CREATE TABLE payment_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL, -- Valor em centavos
    frequency TEXT NOT NULL, -- 'monthly', 'quarterly', etc.
    description TEXT
);

-- Tabela de pagamentos dos estudantes
CREATE TABLE student_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    plan_id INTEGER REFERENCES payment_plans(id) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP NOT NULL,
    paid_date TIMESTAMP,
    amount INTEGER NOT NULL, -- Valor em centavos
    notes TEXT
);

-- Tabela de log de atividades
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    activity TEXT NOT NULL,
    entity_type TEXT, -- Ex: 'student', 'class', 'payment'
    entity_id INTEGER,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de personalizações do dashboard
CREATE TABLE dashboard_customizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    layout TEXT NOT NULL DEFAULT 'default', -- 'default', 'compact', 'minimal'
    theme TEXT NOT NULL DEFAULT 'light', -- 'light', 'dark', 'auto'
    widget_order TEXT[] NOT NULL DEFAULT ARRAY['stats', 'notifications', 'attendance', 'events'],
    hidden_widgets TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    show_welcome_message BOOLEAN NOT NULL DEFAULT true,
    compact_mode BOOLEAN NOT NULL DEFAULT false,
    show_quick_actions BOOLEAN NOT NULL DEFAULT true,
    background_color TEXT DEFAULT '#ffffff',
    accent_color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==================================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- ==================================================

-- Índices para melhor performance
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
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_day_of_week ON classes(day_of_week);

-- ==================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ==================================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_school_config_updated_at 
    BEFORE UPDATE ON school_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_events_updated_at 
    BEFORE UPDATE ON school_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_customizations_updated_at 
    BEFORE UPDATE ON dashboard_customizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- DADOS INICIAIS (INSERTS)
-- ==================================================

-- Inserir configuração inicial da escola
INSERT INTO school_config (
    school_name, 
    congrats_message,
    address,
    phone,
    email,
    default_theme
) VALUES (
    'Academia de Jiu-Jitsu',
    '🏆 Parabéns!
Você acaba de conquistar a sua {beltName}!

Que Deus continue fortalecendo sua fé e determinação nessa jornada.

"Tudo posso naquele que me fortalece."
(Filipenses 4:13)

OSS!',
    'Rua das Artes Marciais, 123 - Centro',
    '(11) 99999-9999',
    'contato@academiajj.com.br',
    'light'
) ON CONFLICT DO NOTHING;

-- Inserir usuário administrador padrão
INSERT INTO users (
    first_name, 
    last_name, 
    username, 
    email, 
    password, 
    role,
    phone,
    city,
    state,
    active
) VALUES (
    'Arkaia',
    'Admin',
    'arkaiadm',
    'admin@senseisystem.com.br',
    '$scrypt$16384$8$1$yK8zRZAJ7eo2jZ2Rj+iSf6WgUJGgVQn2HvT9wD5lLgQ=$H+8Z1MvV2cN9D3gR+7oEkL2hV6X+3wZ4Y9cK+2lT8pQ+', -- senha: password
    'admin',
    '(11) 99999-9999',
    'São Paulo',
    'SP',
    true
) ON CONFLICT (username) DO NOTHING;

-- Inserir professor exemplo
INSERT INTO users (
    first_name, 
    last_name, 
    username, 
    email, 
    password, 
    role,
    phone,
    city,
    state,
    active
) VALUES (
    'João',
    'Silva',
    'prof.joao',
    'joao.professor@senseisystem.com.br',
    '$scrypt$16384$8$1$yK8zRZAJ7eo2jZ2Rj+iSf6WgUJGgVQn2HvT9wD5lLgQ=$H+8Z1MvV2cN9D3gR+7oEkL2hV6X+3wZ4Y9cK+2lT8pQ+', -- senha: password
    'instructor',
    '(11) 98888-8888',
    'São Paulo',
    'SP',
    true
) ON CONFLICT (username) DO NOTHING;

-- Inserir planos de pagamento iniciais
INSERT INTO payment_plans (name, amount, frequency, description) VALUES 
('Mensal Básico', 15000, 'monthly', 'Plano mensal com acesso a todas as aulas básicas'), -- R$ 150,00
('Mensal Premium', 20000, 'monthly', 'Plano mensal com acesso total e aulas particulares'), -- R$ 200,00
('Trimestral', 40000, 'quarterly', 'Plano trimestral com desconto de 15%'), -- R$ 400,00
('Semestral', 75000, 'biannual', 'Plano semestral com desconto de 20%'), -- R$ 750,00
('Anual', 140000, 'yearly', 'Plano anual com desconto de 30%') -- R$ 1.400,00
ON CONFLICT DO NOTHING;

-- Inserir aulas/turmas padrão
INSERT INTO classes (name, description, instructor_id, day_of_week, start_time, duration, max_capacity) VALUES 
('Iniciantes - Manhã', 'Aula para iniciantes no período da manhã', 2, 1, '09:00', 90, 20), -- Segunda-feira
('Intermediário - Manhã', 'Aula para praticantes intermediários', 2, 1, '10:45', 90, 15), -- Segunda-feira
('Iniciantes - Noite', 'Aula para iniciantes no período noturno', 2, 1, '19:00', 90, 25), -- Segunda-feira
('Avançado - Noite', 'Aula para praticantes avançados', 2, 1, '20:45', 90, 12), -- Segunda-feira
('Kids - Tarde', 'Aula para crianças', 2, 3, '15:00', 60, 15), -- Quarta-feira
('Iniciantes - Manhã', 'Aula para iniciantes no período da manhã', 2, 3, '09:00', 90, 20), -- Quarta-feira
('Intermediário - Manhã', 'Aula para praticantes intermediários', 2, 3, '10:45', 90, 15), -- Quarta-feira
('Iniciantes - Noite', 'Aula para iniciantes no período noturno', 2, 3, '19:00', 90, 25), -- Quarta-feira
('Avançado - Noite', 'Aula para praticantes avançados', 2, 3, '20:45', 90, 12), -- Quarta-feira
('Open Mat - Sábado', 'Treino livre aos sábados', 2, 6, '10:00', 120, 30) -- Sábado
ON CONFLICT DO NOTHING;

-- Inserir eventos exemplo da escola
INSERT INTO school_events (title, description, event_date, location, created_by, is_active) VALUES 
('Campeonato Interno', 'Campeonato interno da academia com premiação para os vencedores', '2025-02-15 14:00:00', 'Academia - Tatame Principal', 1, true),
('Seminário de Defesa Pessoal', 'Seminário especial com técnicas de defesa pessoal para mulheres', '2025-03-08 10:00:00', 'Academia - Sala de Eventos', 1, true),
('Graduação de Faixas', 'Cerimônia de graduação de faixas - Março 2025', '2025-03-20 18:00:00', 'Academia - Tatame Principal', 1, true)
ON CONFLICT DO NOTHING;

-- Inserir exemplos de estudantes
INSERT INTO users (
    first_name, 
    last_name, 
    username, 
    email, 
    password, 
    role,
    phone,
    birth_date,
    city,
    state,
    active
) VALUES 
('Maria', 'Santos', 'maria.santos', 'maria@email.com', '$scrypt$16384$8$1$yK8zRZAJ7eo2jZ2Rj+iSf6WgUJGgVQn2HvT9wD5lLgQ=$H+8Z1MvV2cN9D3gR+7oEkL2hV6X+3wZ4Y9cK+2lT8pQ+', 'student', '(11) 97777-7777', '1995-05-15', 'São Paulo', 'SP', true),
('Carlos', 'Oliveira', 'carlos.oliveira', 'carlos@email.com', '$scrypt$16384$8$1$yK8zRZAJ7eo2jZ2Rj+iSf6WgUJGgVQn2HvT9wD5lLgQ=$H+8Z1MvV2cN9D3gR+7oEkL2hV6X+3wZ4Y9cK+2lT8pQ+', 'student', '(11) 96666-6666', '1988-12-03', 'São Paulo', 'SP', true),
('Ana', 'Costa', 'ana.costa', 'ana@email.com', '$scrypt$16384$8$1$yK8zRZAJ7eo2jZ2Rj+iSf6WgUJGgVQn2HvT9wD5lLgQ=$H+8Z1MvV2cN9D3gR+7oEkL2hV6X+3wZ4Y9cK+2lT8pQ+', 'student', '(11) 95555-5555', '1992-08-22', 'São Paulo', 'SP', true),
('Pedro', 'Lima', 'pedro.lima', 'pedro@email.com', '$scrypt$16384$8$1$yK8zRZAJ7eo2jZ2Rj+iSf6WgUJGgVQn2HvT9wD5lLgQ=$H+8Z1MvV2cN9D3gR+7oEkL2hV6X+3wZ4Y9cK+2lT8pQ+', 'student', '(11) 94444-4444', '1985-03-10', 'São Paulo', 'SP', true)
ON CONFLICT (username) DO NOTHING;

-- Inserir registros de estudantes (vinculados aos usuários acima)
INSERT INTO students (user_id, belt_level, stripes, attendance_rate, notes) VALUES 
(3, 'blue', 2, 85, 'Aluna dedicada, boa evolução técnica'),
(4, 'white', 4, 78, 'Bom potencial, precisa melhorar a finalização'),
(5, 'purple', 1, 92, 'Excelente técnica, candidata a faixa marrom'),
(6, 'brown', 0, 88, 'Muito experiente, auxiliar em algumas aulas')
ON CONFLICT DO NOTHING;

-- Inserir alguns pagamentos exemplo
INSERT INTO student_payments (student_id, plan_id, status, due_date, amount, notes) VALUES 
(1, 1, 'paid', '2025-01-31', 15000, 'Pagamento em dia - Janeiro 2025'),
(2, 2, 'pending', '2025-01-31', 20000, 'Aguardando pagamento - Janeiro 2025'),
(3, 1, 'paid', '2025-01-31', 15000, 'Pagamento realizado via PIX'),
(4, 3, 'paid', '2025-03-31', 40000, 'Pagamento trimestral adiantado')
ON CONFLICT DO NOTHING;

-- Inserir registros de presença exemplo
INSERT INTO attendance (student_id, class_id, date, status, checked_in_by) VALUES 
(1, 1, '2025-01-20 09:00:00', 'present', 2),
(1, 3, '2025-01-20 19:00:00', 'present', 2),
(2, 1, '2025-01-20 09:00:00', 'late', 2),
(3, 2, '2025-01-20 10:45:00', 'present', 2),
(4, 4, '2025-01-20 20:45:00', 'present', 2),
(1, 6, '2025-01-22 09:00:00', 'present', 2),
(2, 8, '2025-01-22 19:00:00', 'absent', 2),
(3, 7, '2025-01-22 10:45:00', 'present', 2)
ON CONFLICT DO NOTHING;

-- Inserir logs de atividade iniciais
INSERT INTO activity_logs (user_id, activity, entity_type, entity_id) VALUES 
(1, 'Sistema inicializado', 'system', NULL),
(1, 'Configuração inicial da escola criada', 'school_config', 1),
(1, 'Planos de pagamento configurados', 'payment_plans', NULL),
(1, 'Aulas cadastradas no sistema', 'classes', NULL),
(2, 'Professor cadastrado no sistema', 'user', 2),
(1, 'Estudantes exemplo adicionados', 'students', NULL)
ON CONFLICT DO NOTHING;

-- ==================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- ==================================================

-- View para estudantes com informações completas
CREATE OR REPLACE VIEW students_complete AS
SELECT 
    s.id as student_id,
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.username,
    u.email,
    u.phone,
    u.birth_date,
    s.belt_level,
    s.stripes,
    s.last_promotion_date,
    s.attendance_rate,
    s.notes,
    u.join_date,
    u.active
FROM students s
JOIN users u ON s.user_id = u.id;

-- View para relatório de presenças
CREATE OR REPLACE VIEW attendance_report AS
SELECT 
    sc.first_name || ' ' || sc.last_name as student_name,
    c.name as class_name,
    a.date,
    a.status,
    uc.first_name || ' ' || uc.last_name as checked_in_by_name
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN users sc ON s.user_id = sc.id
JOIN classes c ON a.class_id = c.id
LEFT JOIN users uc ON a.checked_in_by = uc.id
ORDER BY a.date DESC;

-- View para pagamentos em atraso
CREATE OR REPLACE VIEW overdue_payments AS
SELECT 
    sp.id as payment_id,
    u.first_name || ' ' || u.last_name as student_name,
    u.phone,
    u.email,
    pp.name as plan_name,
    sp.amount,
    sp.due_date,
    (CURRENT_DATE - sp.due_date::date) as days_overdue
FROM student_payments sp
JOIN students s ON sp.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN payment_plans pp ON sp.plan_id = pp.id
WHERE sp.status = 'overdue' 
   OR (sp.status = 'pending' AND sp.due_date < CURRENT_DATE)
ORDER BY sp.due_date ASC;

-- ==================================================
-- FUNÇÕES AUXILIARES
-- ==================================================

-- Função para calcular taxa de presença de um estudante
CREATE OR REPLACE FUNCTION calculate_attendance_rate(student_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_classes INTEGER;
    present_classes INTEGER;
    rate INTEGER;
BEGIN
    -- Contar total de aulas do estudante
    SELECT COUNT(*) INTO total_classes
    FROM attendance
    WHERE student_id = student_id_param;
    
    -- Contar presenças
    SELECT COUNT(*) INTO present_classes
    FROM attendance
    WHERE student_id = student_id_param AND status = 'present';
    
    -- Calcular percentual
    IF total_classes > 0 THEN
        rate := ROUND((present_classes::FLOAT / total_classes::FLOAT) * 100);
    ELSE
        rate := 0;
    END IF;
    
    RETURN rate;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar taxa de presença automaticamente
CREATE OR REPLACE FUNCTION update_student_attendance_rate()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE students 
    SET attendance_rate = calculate_attendance_rate(NEW.student_id)
    WHERE id = NEW.student_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar taxa de presença automaticamente
CREATE TRIGGER update_attendance_rate_trigger
    AFTER INSERT OR UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_student_attendance_rate();

-- ==================================================
-- COMENTÁRIOS NAS TABELAS E COLUNAS
-- ==================================================

COMMENT ON TABLE users IS 'Tabela principal de usuários do sistema (admins, instrutores e estudantes)';
COMMENT ON TABLE students IS 'Informações específicas dos estudantes (extensão da tabela users)';
COMMENT ON TABLE school_config IS 'Configurações gerais da escola/academia';
COMMENT ON TABLE classes IS 'Aulas/turmas disponíveis na academia';
COMMENT ON TABLE attendance IS 'Registro de presenças dos estudantes nas aulas';
COMMENT ON TABLE payment_plans IS 'Planos de pagamento disponíveis';
COMMENT ON TABLE student_payments IS 'Pagamentos dos estudantes';
COMMENT ON TABLE activity_logs IS 'Log de atividades do sistema';
COMMENT ON TABLE dashboard_customizations IS 'Personalizações do dashboard por usuário';

-- Comentários em colunas importantes
COMMENT ON COLUMN users.role IS 'Tipo do usuário: admin, instructor ou student';
COMMENT ON COLUMN students.belt_level IS 'Nível da faixa: white, blue, purple, brown, black';
COMMENT ON COLUMN students.stripes IS 'Número de listras na faixa (0-4)';
COMMENT ON COLUMN students.attendance_rate IS 'Taxa de presença em percentual (0-100)';
COMMENT ON COLUMN classes.day_of_week IS 'Dia da semana: 0=Domingo, 1=Segunda, ..., 6=Sábado';
COMMENT ON COLUMN payment_plans.amount IS 'Valor do plano em centavos (ex: 15000 = R$ 150,00)';
COMMENT ON COLUMN student_payments.amount IS 'Valor do pagamento em centavos';

-- ==================================================
-- COMANDOS FINAIS
-- ==================================================

-- Atualizar taxa de presença para todos os estudantes existentes
SELECT update_student_attendance_rate() FROM attendance;

-- Mostrar resumo da estrutura criada
SELECT 
    'Estrutura do banco criada com sucesso!' as status,
    (SELECT COUNT(*) FROM users) as total_usuarios,
    (SELECT COUNT(*) FROM students) as total_estudantes,
    (SELECT COUNT(*) FROM classes) as total_aulas,
    (SELECT COUNT(*) FROM payment_plans) as total_planos,
    (SELECT COUNT(*) FROM school_events) as total_eventos;

-- ==================================================
-- COMANDOS PARA BACKUP E RESTORE
-- ==================================================

-- Para fazer backup:
-- pg_dump -h localhost -U postgres -d senseisystem > backup_senseisystem.sql

-- Para restaurar:
-- psql -h localhost -U postgres -d senseisystem < backup_senseisystem.sql

-- ==================================================
-- FIM DO ARQUIVO
-- ==================================================