import { 
  User, Student, Plan, StudentPlan, ClassSession, Attendance, 
  LoginResponse, UserWithStudent
} from '@shared/schema';

export type { 
  User, Student, Plan, StudentPlan, ClassSession, Attendance, 
  LoginResponse, UserWithStudent
};

export interface AuthState {
  user: UserWithStudent | null;
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
  user: UserWithStudent | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string) => Promise<void>;
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
  classes: ClassSession[];
  activeStudents: Student[];
}

export interface StudentDashboardResponse {
  attendanceStats: {
    present: number;
    absent: number;
  };
  classes: ClassSession[];
  currentPlan: (StudentPlan & { plan: Plan }) | null;
}

export interface SidebarMenuItem {
  key: string;
  label: string;
  icon: string;
  href: string;
  roles: string[];
}
