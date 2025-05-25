
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // User Address and Birth Date
      birthDate: "Birth Date",
      address: "Address",
      street: "Street",
      number: "Number",
      complement: "Complement",
      neighborhood: "Neighborhood",
      city: "City",
      state: "State",
      zipCode: "ZIP Code",
      searchAddress: "Search Address",
      
      // Belt Names
      whiteBelt: "White Belt",
      blueBelt: "Blue Belt",
      purpleBelt: "Purple Belt",
      brownBelt: "Brown Belt",
      blackBelt: "Black Belt",
      
      // Auth Hero Section
      appDescription: "Jiu-Jitsu School Management",
      appSubDescription: "Track your progress, manage your attendance, and stay connected with your Jiu-Jitsu community.",
      trackAttendanceFeature: "Track Attendance",
      trackAttendanceDescription: "Never miss a class and keep track of your training journey.",
      beltProgressionFeature: "Belt Progression",
      beltProgressionDescription: "Monitor your belt level and stripes as you advance in your journey.",
      classScheduleFeature: "Class Schedule",
      classScheduleDescription: "View upcoming classes and manage your training schedule.",
      paymentManagementFeature: "Payment Management",
      paymentManagementDescription: "Handle your membership fees and payment schedules easily.",

      // Navigation
      main: "Main",
      account: "Account",
      dashboard: "Dashboard",
      students: "Students",
      attendance: "Attendance", 
      classes: "Classes",
      payments: "Payments",
      reports: "Reports",
      profile: "Profile",
      settings: "Settings",
      logout: "Logout",
      
      // Dashboard
      totalStudents: "Total Students",
      activeClasses: "Active Classes",
      monthlyRevenue: "Monthly Revenue",
      attendanceRate: "Attendance Rate",
      recentActivity: "Recent Activity",
      beltDistribution: "Belt Distribution",
      upcomingClasses: "Upcoming Classes",
      welcomeMessage: "Welcome back, {{name}}!",
      newStudent: "New Student",
      todaysClasses: "Today's Classes",
      viewAll: "View All",
      noClassesScheduled: "No classes scheduled for today",
      studentsRequiringAttention: "Students Requiring Attention",
      viewDetailedReport: "View Detailed Report",
      loadingStudents: "Loading students...",
      noStudentsRequiringAttention: "No students requiring attention",
      takeAttendance: "Take Attendance",
      paymentOverdue: "Payment Overdue",
      paymentDueSoon: "Payment Due Soon",
      
      // Students
      addStudent: "Add Student",
      editStudent: "Edit Student",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone",
      emergencyContact: "Emergency Contact",
      beltLevel: "Belt Level",
      active: "Active",
      inactive: "Inactive",
      
      // Classes
      addClass: "Add Class",
      className: "Class Name",
      instructor: "Instructor",
      dayOfWeek: "Day of Week",
      startTime: "Start Time",
      endTime: "End Time",
      capacity: "Capacity",
      
      // Common
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      search: "Search",
      actions: "Actions",
      loading: "Loading...",
      noData: "No data found",
      
      // Settings
      settingsTitle: "Settings",
      configurePreferences: "Configure your application preferences",
      saveSettings: "Save Settings",
      saving: "Saving...",
      themeSettings: "Theme Settings",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      language: "Language",
      notificationSettings: "Notification Settings",
      emailNotifications: "Email Notifications",
      smsNotifications: "SMS Notifications",
      
      // Auth
      login: "Login",
      register: "Register",
      username: "Username",
      password: "Password",
      
      // Success/Error messages
      success: "Success",
      error: "Error",
      settingsSaved: "Settings saved successfully",
      failedToSave: "Failed to save settings",
      
      // Additional translations
      manageStudents: "Manage your students",
      allStudents: "All Students",
      noStudentsFound: "No students found matching your search",
      trackAttendance: "Track and manage class attendance",
      selectDate: "Select Date",
      byClass: "By Class",
      byStudent: "By Student",
      noAttendanceRecords: "No attendance records found for this date",
      studentViewComingSoon: "Student view coming soon",
      
      // Payment Form
      student: "Student",
      select_student: "Select a student",
      payment_plan: "Payment Plan",
      select_payment_plan: "Select a payment plan",
      due_date: "Due Date",
      payment_date: "Payment Date",
      pick_date: "Pick a date",
      status: "Status",
      select_status: "Select status",
      paid: "Paid",
      pending: "Pending",
      overdue: "Overdue",
      notes: "Notes",
      payment_notes_placeholder: "Any additional notes about this payment",
      save_payment: "Save Payment",
      create_payment: "Create Payment",
      update_payment: "Update Payment"
    }
  },
  pt: {
    translation: {
      // User Address and Birth Date
      birthDate: "Data de Nascimento",
      address: "Endereço",
      street: "Rua",
      number: "Número",
      complement: "Complemento",
      neighborhood: "Bairro",
      city: "Cidade",
      state: "Estado",
      zipCode: "CEP",
      searchAddress: "Buscar Endereço",
      
      // Belt Names
      whiteBelt: "Faixa Branca",
      blueBelt: "Faixa Azul",
      purpleBelt: "Faixa Roxa",
      brownBelt: "Faixa Marrom",
      blackBelt: "Faixa Preta",
      
      // Auth Hero Section
      appDescription: "Sistema de Gestão para Escolas de Jiu-Jitsu",
      appSubDescription: "Acompanhe seu progresso, gerencie sua presença e mantenha-se conectado com sua comunidade de Jiu-Jitsu.",
      trackAttendanceFeature: "Controle de Presença",
      trackAttendanceDescription: "Nunca perca uma aula e acompanhe sua jornada de treinamento.",
      beltProgressionFeature: "Progressão de Faixa",
      beltProgressionDescription: "Monitore seu nível de faixa e suas graus à medida que avança em sua jornada.",
      classScheduleFeature: "Agenda de Aulas",
      classScheduleDescription: "Visualize as próximas aulas e gerencie seu cronograma de treinamento.",
      paymentManagementFeature: "Gestão de Pagamentos",
      paymentManagementDescription: "Gerencie suas mensalidades e cronogramas de pagamento facilmente.",
      
      // Navigation
      main: "Principal",
      account: "Conta",
      dashboard: "Painel",
      students: "Alunos",
      attendance: "Presença",
      classes: "Aulas",
      payments: "Pagamentos",
      reports: "Relatórios",
      profile: "Perfil",
      settings: "Configurações",
      logout: "Sair",
      
      // Dashboard
      totalStudents: "Total de Alunos",
      activeClasses: "Aulas Ativas",
      monthlyRevenue: "Receita Mensal",
      attendanceRate: "Taxa de Presença",
      recentActivity: "Atividade Recente",
      beltDistribution: "Distribuição de Faixas",
      upcomingClasses: "Próximas Aulas",
      welcomeMessage: "Bem-vindo de volta, {{name}}!",
      newStudent: "Novo Aluno",
      todaysClasses: "Aulas de Hoje",
      viewAll: "Ver Todos",
      noClassesScheduled: "Nenhuma aula agendada para hoje",
      studentsRequiringAttention: "Alunos Requerendo Atenção",
      viewDetailedReport: "Ver Relatório Detalhado",
      loadingStudents: "Carregando alunos...",
      noStudentsRequiringAttention: "Nenhum aluno requerendo atenção",
      takeAttendance: "Registrar Presença",
      paymentOverdue: "Pagamento Atrasado",
      paymentDueSoon: "Pagamento Próximo do Vencimento",
      
      // Students
      addStudent: "Adicionar Aluno",
      editStudent: "Editar Aluno",
      firstName: "Nome",
      lastName: "Sobrenome",
      email: "E-mail",
      phone: "Telefone",
      emergencyContact: "Contato de Emergência",
      beltLevel: "Graduação",
      active: "Ativo",
      inactive: "Inativo",
      
      // Classes
      addClass: "Adicionar Aula",
      className: "Nome da Aula",
      instructor: "Instrutor",
      dayOfWeek: "Dia da Semana",
      startTime: "Horário de Início",
      endTime: "Horário de Término",
      capacity: "Capacidade",
      
      // Common
      save: "Salvar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Excluir",
      search: "Buscar",
      actions: "Ações",
      loading: "Carregando...",
      noData: "Nenhum dado encontrado",
      
      // Settings
      settingsTitle: "Configurações",
      configurePreferences: "Configure suas preferências do aplicativo",
      saveSettings: "Salvar Configurações",
      saving: "Salvando...",
      themeSettings: "Configurações do Tema",
      theme: "Tema",
      light: "Claro",
      dark: "Escuro",
      language: "Idioma",
      notificationSettings: "Configurações de Notificação",
      emailNotifications: "Notificações por E-mail",
      smsNotifications: "Notificações por SMS",
      
      // Auth
      login: "Entrar",
      register: "Registrar",
      username: "Usuário",
      password: "Senha",
      createAccount: "Criar uma Conta",
      loginDescription: "Digite suas credenciais para acessar sua conta.",
      registerDescription: "Digite suas informações para criar uma nova conta.",
      loggingIn: "Entrando...",
      selectRole: "Selecione uma função",
      selectBeltLevel: "Selecione a graduação",
      numberStripes: "Número de faixas",
      registrationSuccess: "Registro Concluído!",
      registrationSuccessMessage: "Sua conta foi criada e está aguardando aprovação. Você será notificado quando for ativada.",
      stripes: "Faixas",
      white: "Branca",
      blue: "Azul",
      purple: "Roxa",
      brown: "Marrom",
      black: "Preta",
      confirmPassword: "Confirmar Senha",
      
      // Success/Error messages
      success: "Sucesso",
      error: "Erro",
      settingsSaved: "Configurações salvas com sucesso",
      failedToSave: "Falha ao salvar configurações",
      
      // Additional translations
      manageStudents: "Gerencie seus alunos",
      allStudents: "Todos os Alunos",
      noStudentsFound: "Nenhum aluno encontrado",
      trackAttendance: "Acompanhe e gerencie a presença nas aulas",
      selectDate: "Selecionar Data",
      byClass: "Por Aula",
      byStudent: "Por Aluno",
      noAttendanceRecords: "Nenhum registro de presença encontrado para esta data",
      studentViewComingSoon: "Visualização por aluno em breve",
      minutes: "minutos",
      max: "Máximo",
      studentsLabel: "alunos",
      noInstructorAssigned: "Nenhum instrutor designado",
      studentsPresent: "alunos presentes",
      studentPresent: "aluno presente",
      
      // Payment Plans
      payment_plans: "Planos de Pagamento",
      manage_payment_plans: "Gerencie os planos de pagamento para alunos",
      search_plans: "Buscar planos",
      new_plan: "Novo Plano",
      add_new_plan: "Adicionar Novo Plano",
      plan_name: "Nome do Plano",
      plan_amount: "Valor",
      plan_frequency: "Frequência",
      plan_description: "Descrição",
      select_frequency: "Selecione a frequência",
      weekly: "Semanal",
      biweekly: "Quinzenal",
      monthly: "Mensal",
      quarterly: "Trimestral",
      semiannual: "Semestral",
      annual: "Anual",
      create_plan: "Criar Plano",
      update_plan: "Atualizar Plano",
      edit_plan: "Editar Plano",
      name: "Nome",
      amount: "Valor",
      frequency: "Frequência",
      description: "Descrição",
      loading_plans: "Carregando planos...",
      no_plans_found: "Nenhum plano encontrado",
      no_plans_matching_search: "Nenhum plano corresponde à busca",
      plan_added_successfully: "Plano adicionado com sucesso",
      plan_updated_successfully: "Plano atualizado com sucesso",
      plan_deleted_successfully: "Plano excluído com sucesso",
      failed_to_add_plan: "Falha ao adicionar plano",
      failed_to_update_plan: "Falha ao atualizar plano",
      failed_to_delete_plan: "Falha ao excluir plano",
      confirm_delete_plan: "Tem certeza que deseja excluir este plano?",
      
      // Payment Form
      student: "Aluno",
      select_student: "Selecione um aluno",
      payment_plan: "Plano de Pagamento",
      select_payment_plan: "Selecione um plano de pagamento",
      due_date: "Data de Vencimento",
      payment_date: "Data de Pagamento",
      pick_date: "Selecione uma data",
      status: "Status",
      select_status: "Selecione o status",
      paid: "Pago",
      pending: "Pendente",
      overdue: "Atrasado",
      notes: "Observações",
      payment_notes_placeholder: "Observações adicionais sobre este pagamento",
      save_payment: "Salvar Pagamento",
      create_payment: "Criar Pagamento",
      update_payment: "Atualizar Pagamento"
    }
  },
  es: {
    translation: {
      // Navigation
      main: "Principal",
      account: "Cuenta",
      dashboard: "Panel",
      students: "Estudiantes",
      attendance: "Asistencia",
      classes: "Clases",
      payments: "Pagos",
      reports: "Informes",
      profile: "Perfil",
      settings: "Configuración",
      logout: "Cerrar Sesión",
      
      // Dashboard
      totalStudents: "Total de Estudiantes",
      activeClasses: "Clases Activas",
      monthlyRevenue: "Ingresos Mensuales",
      attendanceRate: "Tasa de Asistencia",
      recentActivity: "Actividad Reciente",
      beltDistribution: "Distribución de Cinturones",
      upcomingClasses: "Próximas Clases",
      
      // Students
      addStudent: "Agregar Estudiante",
      editStudent: "Editar Estudiante",
      firstName: "Nombre",
      lastName: "Apellido",
      email: "Correo",
      phone: "Teléfono",
      emergencyContact: "Contacto de Emergencia",
      beltLevel: "Nivel de Cinturón",
      active: "Activo",
      inactive: "Inactivo",
      
      // Classes
      addClass: "Agregar Clase",
      className: "Nombre de la Clase",
      instructor: "Instructor",
      dayOfWeek: "Día de la Semana",
      startTime: "Hora de Inicio",
      endTime: "Hora de Fin",
      capacity: "Capacidad",
      
      // Common
      save: "Guardar",
      cancel: "Cancelar",
      edit: "Editar",
      delete: "Eliminar",
      search: "Buscar",
      actions: "Acciones",
      loading: "Cargando...",
      noData: "No se encontraron datos",
      
      // Settings
      settingsTitle: "Configuración",
      configurePreferences: "Configure sus preferencias de la aplicación",
      saveSettings: "Guardar Configuración",
      saving: "Guardando...",
      themeSettings: "Configuración del Tema",
      theme: "Tema",
      light: "Claro",
      dark: "Oscuro",
      language: "Idioma",
      notificationSettings: "Configuración de Notificaciones",
      emailNotifications: "Notificaciones por Correo",
      smsNotifications: "Notificaciones por SMS",
      
      // Auth
      login: "Iniciar Sesión",
      register: "Registrar",
      username: "Usuario",
      password: "Contraseña",
      
      // Success/Error messages
      success: "Éxito",
      error: "Error",
      settingsSaved: "Configuración guardada exitosamente",
      failedToSave: "Error al guardar configuración"
    }
  },
  ja: {
    translation: {
      // Navigation
      main: "メイン",
      account: "アカウント",
      dashboard: "ダッシュボード",
      students: "生徒",
      attendance: "出席",
      classes: "クラス",
      payments: "支払い",
      reports: "レポート",
      profile: "プロフィール",
      settings: "設定",
      logout: "ログアウト",
      
      // Dashboard
      totalStudents: "生徒総数",
      activeClasses: "アクティブクラス",
      monthlyRevenue: "月間収益",
      attendanceRate: "出席率",
      recentActivity: "最近の活動",
      beltDistribution: "帯の分布",
      upcomingClasses: "今後のクラス",
      
      // Students
      addStudent: "生徒を追加",
      editStudent: "生徒を編集",
      firstName: "名",
      lastName: "姓",
      email: "メール",
      phone: "電話",
      emergencyContact: "緊急連絡先",
      beltLevel: "帯のレベル",
      active: "アクティブ",
      inactive: "非アクティブ",
      
      // Classes
      addClass: "クラスを追加",
      className: "クラス名",
      instructor: "インストラクター",
      dayOfWeek: "曜日",
      startTime: "開始時間",
      endTime: "終了時間",
      capacity: "定員",
      
      // Common
      save: "保存",
      cancel: "キャンセル",
      edit: "編集",
      delete: "削除",
      search: "検索",
      actions: "アクション",
      loading: "読み込み中...",
      noData: "データが見つかりません",
      
      // Settings
      settingsTitle: "設定",
      configurePreferences: "アプリケーションの設定を構成",
      saveSettings: "設定を保存",
      saving: "保存中...",
      themeSettings: "テーマ設定",
      theme: "テーマ",
      light: "ライト",
      dark: "ダーク",
      language: "言語",
      notificationSettings: "通知設定",
      emailNotifications: "メール通知",
      smsNotifications: "SMS通知",
      
      // Auth
      login: "ログイン",
      register: "登録",
      username: "ユーザー名",
      password: "パスワード",
      
      // Success/Error messages
      success: "成功",
      error: "エラー",
      settingsSaved: "設定が正常に保存されました",
      failedToSave: "設定の保存に失敗しました"
    }
  }
};

// Initialize i18next with language detection and browser storage
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Prevents issues during SSR or when components load before translations
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
