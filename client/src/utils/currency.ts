// Utilitários para formatação de moeda brasileira
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

export const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};