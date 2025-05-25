
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
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
      failedToSave: "Failed to save settings"
    }
  },
  pt: {
    translation: {
      // Navigation
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
      
      // Success/Error messages
      success: "Sucesso",
      error: "Erro",
      settingsSaved: "Configurações salvas com sucesso",
      failedToSave: "Falha ao salvar configurações"
    }
  },
  es: {
    translation: {
      // Navigation
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

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
