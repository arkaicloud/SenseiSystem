import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(firstName?: string, lastName?: string): string {
  const firstInitial = firstName && firstName.length > 0 ? firstName.charAt(0) : '';
  const lastInitial = lastName && lastName.length > 0 ? lastName.charAt(0) : '';
  return `${firstInitial}${lastInitial}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100);
}

export function formatCurrencyBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatCurrencyBRLInput(amount: number): string {
  // Formata para o padrão brasileiro sem o símbolo R$
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parseCurrencyBRL(value: string): number {
  // Remove quaisquer caracteres não numéricos exceto vírgula e ponto
  const sanitized = value.replace(/[^\d,\.]/g, '');
  
  // Converte de formato BR (1.234,56) para formato numérico (1234.56)
  const numericValue = sanitized.replace(/\./g, '').replace(',', '.');
  
  return parseFloat(numericValue);
}

export function formatTime(time: string): { time: string; period: string } {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  
  return {
    time: `${formattedHour}:${minutes}`,
    period,
  };
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[dayOfWeek];
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getBeltColor(beltLevel: string): string {
  const beltColors = {
    white: '#FFFFFF',
    blue: '#0066CC',
    purple: '#6B46C1',
    brown: '#8B4513',
    black: '#000000',
  };
  return beltColors[beltLevel as keyof typeof beltColors] || '#FFFFFF';
}

export function calculateTotalPercentage(distribution: Record<string, number>): Record<string, number> {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return Object.keys(distribution).reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {} as Record<string, number>);
  }
  
  return Object.entries(distribution).reduce((acc, [key, count]) => {
    acc[key] = Math.round((count / total) * 100);
    return acc;
  }, {} as Record<string, number>);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function calculateTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora há pouco';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `há ${diffInDays} dia${diffInDays !== 1 ? 's' : ''}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `há ${diffInWeeks} semana${diffInWeeks !== 1 ? 's' : ''}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `há ${diffInMonths} mês${diffInMonths !== 1 ? 'es' : ''}`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `há ${diffInYears} ano${diffInYears !== 1 ? 's' : ''}`;
}
