
-- =====================================================
-- SENSEISYSTEM - QUERY ESTRUTURA COMPLETA DO BANCO
-- Query para visualizar toda a estrutura das tabelas
-- =====================================================

-- 1. TABELA: users (Usuários base)
SELECT 
    'users' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao,
    character_maximum_length as tamanho_max
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. TABELA: students (Estudantes)
SELECT 
    'students' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- 3. TABELA: school_config (Configuração da Escola)
SELECT 
    'school_config' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'school_config' 
ORDER BY ordinal_position;

-- 4. TABELA: school_payments (Pagamentos da Escola)
SELECT 
    'school_payments' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'school_payments' 
ORDER BY ordinal_position;

-- 5. TABELA: belt_levels (Níveis de Faixa)
SELECT 
    'belt_levels' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'belt_levels' 
ORDER BY ordinal_position;

-- 6. TABELA: classes (Aulas/Turmas)
SELECT 
    'classes' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;

-- 7. TABELA: class_enrollments (Inscrições em Aulas)
SELECT 
    'class_enrollments' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'class_enrollments' 
ORDER BY ordinal_position;

-- 8. TABELA: attendance (Presenças)
SELECT 
    'attendance' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'attendance' 
ORDER BY ordinal_position;

-- 9. TABELA: attendance_changes (Mudanças de Presença)
SELECT 
    'attendance_changes' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'attendance_changes' 
ORDER BY ordinal_position;

-- 10. TABELA: payment_plans (Planos de Pagamento)
SELECT 
    'payment_plans' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'payment_plans' 
ORDER BY ordinal_position;

-- 11. TABELA: student_payments (Pagamentos dos Estudantes)
SELECT 
    'student_payments' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'student_payments' 
ORDER BY ordinal_position;

-- 12. TABELA: contas_receber (Contas a Receber - ASAAS)
SELECT 
    'contas_receber' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'contas_receber' 
ORDER BY ordinal_position;

-- 13. TABELA: school_events (Eventos da Escola)
SELECT 
    'school_events' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'school_events' 
ORDER BY ordinal_position;

-- 14. TABELA: health_questionnaires (Questionários de Saúde)
SELECT 
    'health_questionnaires' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'health_questionnaires' 
ORDER BY ordinal_position;

-- 15. TABELA: student_documents (Documentos dos Estudantes)
SELECT 
    'student_documents' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'student_documents' 
ORDER BY ordinal_position;

-- 16. TABELA: documents (Documentos Gerais)
SELECT 
    'documents' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;

-- 17. TABELA: notices (Avisos/Comunicados)
SELECT 
    'notices' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'notices' 
ORDER BY ordinal_position;

-- 18. TABELA: student_notifications (Notificações dos Estudantes)
SELECT 
    'student_notifications' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'student_notifications' 
ORDER BY ordinal_position;

-- 19. TABELA: activity_logs (Log de Atividades)
SELECT 
    'activity_logs' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'activity_logs' 
ORDER BY ordinal_position;

-- 20. TABELA: password_reset_tokens (Tokens de Reset de Senha)
SELECT 
    'password_reset_tokens' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'password_reset_tokens' 
ORDER BY ordinal_position;

-- 21. TABELA: dashboard_customizations (Personalizações do Dashboard)
SELECT 
    'dashboard_customizations' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'dashboard_customizations' 
ORDER BY ordinal_position;

-- 22. TABELA: risk_actions (Ações de Risco)
SELECT 
    'risk_actions' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'risk_actions' 
ORDER BY ordinal_position;

-- 23. TABELA: risk_settings (Configurações de Risco)
SELECT 
    'risk_settings' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'risk_settings' 
ORDER BY ordinal_position;

-- 24. TABELA: streak_achievements (Conquistas de Sequência)
SELECT 
    'streak_achievements' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'streak_achievements' 
ORDER BY ordinal_position;

-- 25. TABELA: daily_login_records (Registros Diários de Login)
SELECT 
    'daily_login_records' as tabela,
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'daily_login_records' 
ORDER BY ordinal_position;

-- =====================================================
-- QUERY UNIFICADA - TODAS AS TABELAS
-- =====================================================

SELECT 
    t.table_name as tabela,
    c.column_name as coluna,
    c.data_type as tipo,
    c.is_nullable as permite_null,
    c.column_default as valor_padrao,
    c.character_maximum_length as tamanho_max,
    CASE 
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN 'PK'
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN 'FK'
        WHEN tc.constraint_type = 'UNIQUE' THEN 'UQ'
        ELSE NULL
    END as constraint_tipo
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
LEFT JOIN information_schema.key_column_usage kcu ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
AND t.table_name IN (
    'users', 'students', 'school_config', 'school_payments', 'belt_levels',
    'classes', 'class_enrollments', 'attendance', 'attendance_changes',
    'payment_plans', 'student_payments', 'contas_receber', 'school_events',
    'health_questionnaires', 'student_documents', 'documents', 'notices',
    'student_notifications', 'activity_logs', 'password_reset_tokens',
    'dashboard_customizations', 'risk_actions', 'risk_settings',
    'streak_achievements', 'daily_login_records'
)
ORDER BY t.table_name, c.ordinal_position;

-- =====================================================
-- RELACIONAMENTOS ENTRE TABELAS
-- =====================================================

SELECT 
    tc.table_name as tabela_origem,
    kcu.column_name as coluna_origem,
    ccu.table_name as tabela_destino,
    ccu.column_name as coluna_destino,
    tc.constraint_name as nome_constraint
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- ÍNDICES DAS TABELAS
-- =====================================================

SELECT 
    schemaname as schema,
    tablename as tabela,
    indexname as indice,
    indexdef as definicao
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'students', 'school_config', 'school_payments', 'belt_levels',
    'classes', 'class_enrollments', 'attendance', 'attendance_changes',
    'payment_plans', 'student_payments', 'contas_receber', 'school_events',
    'health_questionnaires', 'student_documents', 'documents', 'notices',
    'student_notifications', 'activity_logs', 'password_reset_tokens',
    'dashboard_customizations', 'risk_actions', 'risk_settings',
    'streak_achievements', 'daily_login_records'
)
ORDER BY tablename, indexname;

-- =====================================================
-- ENUMS UTILIZADOS NO SISTEMA
-- =====================================================

SELECT 
    n.nspname as schema,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as ordem
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- =====================================================
-- CONTAGEM DE REGISTROS POR TABELA
-- =====================================================

SELECT 
    'users' as tabela, 
    COUNT(*) as total_registros 
FROM users
UNION ALL
SELECT 
    'students' as tabela, 
    COUNT(*) as total_registros 
FROM students
UNION ALL
SELECT 
    'classes' as tabela, 
    COUNT(*) as total_registros 
FROM classes
UNION ALL
SELECT 
    'attendance' as tabela, 
    COUNT(*) as total_registros 
FROM attendance
UNION ALL
SELECT 
    'payment_plans' as tabela, 
    COUNT(*) as total_registros 
FROM payment_plans
UNION ALL
SELECT 
    'student_payments' as tabela, 
    COUNT(*) as total_registros 
FROM student_payments
UNION ALL
SELECT 
    'school_events' as tabela, 
    COUNT(*) as total_registros 
FROM school_events
UNION ALL
SELECT 
    'activity_logs' as tabela, 
    COUNT(*) as total_registros 
FROM activity_logs
ORDER BY tabela;
