
// SenseiSystem - Paleta Oficial de Cores
// Utilitários para uso programático das cores da marca

export const senseiColors = {
  // Cores Primárias (Identidade da Marca)
  primary: {
    main: '#4285F4', // Azul Google
    light: '#5A9BF7', // Azul mais claro
    dark: '#2C5DBE', // Azul mais escuro
    foreground: '#FFFFFF'
  },
  
  secondary: {
    main: '#94A3B8', // Gray-400
    light: '#CBD5E1', // Gray-300
    dark: '#64748B', // Gray-500
    foreground: '#FFFFFF'
  },
  
  accent: {
    main: '#FBBF24', // Amber-400
    light: '#FCD34D', // Amber-300
    dark: '#F59E0B', // Amber-500
    foreground: '#1E293B'
  },

  // Tema Claro (Light Mode)
  light: {
    background: {
      primary: '#FFFFFF', // Branco
      secondary: '#F8FAFC', // Cinza Claro
      hover: '#EFF6FF' // Azul Claro
    },
    text: {
      primary: '#1E293B', // Cinza Escuro
      secondary: '#64748B', // Cinza Médio
      muted: '#94A3B8' // Azul Cinzento
    },
    border: {
      main: '#E2E8F0', // Cinza Suave
      light: '#F1F5F9'
    }
  },

  // Tema Escuro (Dark Mode)
  dark: {
    background: {
      primary: '#0F172A', // Azul Grafite
      secondary: '#1E293B', // Azul Chumbo
      hover: '#1D4ED8' // Azul Acetinado
    },
    text: {
      primary: '#F1F5F9', // Branco Suave
      secondary: '#94A3B8', // Azul Cinzento
      muted: '#64748B'
    },
    border: {
      main: '#334155', // Cinza Profundo
      light: '#475569'
    }
  },

  // Status Colors (para ícones, alertas e status)
  status: {
    success: '#22C55E', // Verde Sucesso - Presença confirmada, pagamento ok
    error: '#EF4444', // Vermelho Erro - Aluno em risco, inadimplente
    warning: '#F97316', // Laranja Alerta - Aviso, atenção, ação pendente
    info: '#2563EB' // Azul Info
  }
} as const;

// Função utilitária para obter cor baseada no tema
export const getSenseiColor = (colorPath: string, theme: 'light' | 'dark' = 'light') => {
  const paths = colorPath.split('.');
  let color: any = senseiColors;
  
  for (const path of paths) {
    color = color[path];
    if (!color) return null;
  }
  
  return color;
};

// Classes Tailwind personalizadas para cores do SenseiSystem
export const senseiTailwindClasses = {
  // Backgrounds
  bg: {
    primary: 'bg-[#4285F4]',
    secondary: 'bg-[#94A3B8]',
    accent: 'bg-[#FBBF24]',
    success: 'bg-[#22C55E]',
    error: 'bg-[#EF4444]',
    warning: 'bg-[#F97316]'
  },
  
  // Text colors
  text: {
    primary: 'text-[#4285F4]',
    secondary: 'text-[#94A3B8]',
    accent: 'text-[#FBBF24]',
    success: 'text-[#22C55E]',
    error: 'text-[#EF4444]',
    warning: 'text-[#F97316]'
  },
  
  // Border colors
  border: {
    primary: 'border-[#4285F4]',
    secondary: 'border-[#94A3B8]',
    accent: 'border-[#FBBF24]',
    success: 'border-[#22C55E]',
    error: 'border-[#EF4444]',
    warning: 'border-[#F97316]'
  }
} as const;
