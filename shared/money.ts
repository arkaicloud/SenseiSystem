/**
 * Money utilities for Brazilian Real (BRL) currency
 * All internal values are stored in cents as integers
 */

/**
 * Converts BRL input (string or number) to cents (integer)
 * @param input - "110,00", "110.00", "R$ 110,00", 110, etc.
 * @returns number in cents (e.g., 11000 for R$ 110,00)
 */
export function brlToCents(input: string | number): number {
  if (typeof input === 'number') {
    // If already a number, assume it's in reais and convert to cents
    return Math.round(input * 100);
  }

  // Remove all non-numeric characters except comma and dot
  const sanitized = input.replace(/[^\d,\.]/g, '');
  
  if (!sanitized) return 0;

  // Handle Brazilian format: 1.234,56 -> 1234.56
  let normalized = sanitized;
  
  // If there's both comma and dot, assume Brazilian format (1.234,56)
  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  // If only comma, assume it's decimal separator (110,00)
  else if (normalized.includes(',') && !normalized.includes('.')) {
    normalized = normalized.replace(',', '.');
  }
  // If only dots, check if it's thousands separator or decimal
  else if (normalized.includes('.')) {
    const parts = normalized.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Likely decimal separator: 110.00
      normalized = normalized;
    } else {
      // Likely thousands separator: 1.000 -> 1000
      normalized = normalized.replace(/\./g, '');
    }
  }

  const amount = parseFloat(normalized);
  return isNaN(amount) ? 0 : Math.round(amount * 100);
}

/**
 * Converts cents (integer) to BRL formatted string
 * @param cents - amount in cents (e.g., 11000)
 * @returns formatted string (e.g., "R$ 110,00")
 */
export function centsToBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/**
 * Formats any number as BRL currency
 * @param amount - amount in reais (e.g., 110.50)
 * @returns formatted string (e.g., "R$ 110,50")
 */
export function formatBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/**
 * Formats BRL input for better UX (optional)
 * @param value - current input value
 * @returns formatted input value
 */
export function formatBRLInput(value: string): string {
  // Remove non-numeric characters except comma
  const cleaned = value.replace(/[^\d,]/g, '');
  
  // Add comma before last 2 digits if not present
  if (cleaned.length > 2 && !cleaned.includes(',')) {
    return cleaned.slice(0, -2) + ',' + cleaned.slice(-2);
  }
  
  return cleaned;
}

/**
 * Validates if a cents amount is reasonable for a paid plan
 * @param cents - amount in cents
 * @param threshold - minimum cents (default: 500 = R$ 5,00)
 * @returns true if amount seems valid
 */
export function isValidPlanAmount(cents: number, threshold: number = 500): boolean {
  return cents >= threshold;
}