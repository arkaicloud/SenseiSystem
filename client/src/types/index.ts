import { 
  User, Student, PaymentPlan, StudentPayment, Class, Attendance, 
  StudentWithUser
} from '@shared/schema';

export type { 
  User, Student, PaymentPlan, StudentPayment, Class, Attendance, 
  StudentWithUser
};

// Missing types that need to be defined
export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LocaleOption {
  value: 'pt-BR' | 'en-US';
  label: string;
  flag: string;
}

export interface LanguageContextType {
  locale: 'pt-BR' | 'en-US';
  setLocale: (locale: 'pt-BR' | 'en-US') => void;
  t: (key: string) => string;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResponse | void>;
  register: (email: string, password: string, additionalData: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export interface DashboardStatsResponse {
  totalStudents: number;
  activeStudents: number;
  classesThisMonth: number;
  monthlyRevenue: number;
  beltDistribution: {
    white: number;
    blue: number;
    purple: number;
    brown: number;
    black: number;
  };
}

export interface InstructorDashboardResponse {
  classes: Class[];
  activeStudents: Student[];
}

export interface StudentDashboardResponse {
  attendanceStats: {
    present: number;
    absent: number;
  };
  classes: Class[];
  currentPlan: (StudentPayment & { plan: PaymentPlan }) | null;
}

export interface SidebarMenuItem {
  key: string;
  label: string;
  icon: string;
  href: string;
  roles: string[];
}
