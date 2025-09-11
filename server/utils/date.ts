// Date normalization utilities for ensuring consistent date handling
// Based on Brazil timezone (America/Sao_Paulo)

/**
 * Normalizes a date string to 00:00:00 UTC for the given timezone
 * This ensures all dates are stored consistently in the database
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param tz - Timezone (default: America/Sao_Paulo)
 * @returns Date object normalized to start of day in UTC
 */
export function toDayUTC(dateStr: string, tz = "America/Sao_Paulo"): Date {
  // Parse the date string and create a Date object at 00:00:00 in the specified timezone
  // For Brazil (UTC-3), we add 3 hours to get the UTC equivalent of midnight local time
  const localDate = new Date(`${dateStr}T00:00:00${tz === "America/Sao_Paulo" ? "-03:00" : "Z"}`);
  
  // Create a normalized UTC date for consistent database storage
  return new Date(Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate()));
}

/**
 * Gets the current date normalized to start of day UTC
 * @param tz - Timezone (default: America/Sao_Paulo)
 * @returns Date object for today at 00:00:00 UTC
 */
export function todayUTC(tz = "America/Sao_Paulo"): Date {
  const now = new Date();
  // Ajustar para fuso horário de Brasília
  const brasiliaOffset = -3 * 60; // -3 horas em minutos
  const brasiliaTime = new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000);
  const todayStr = brasiliaTime.toISOString().split('T')[0]; // Get YYYY-MM-DD
  return toDayUTC(todayStr, tz);
}

/**
 * Formats a date to YYYY-MM-DD string
 * @param date - Date object
 * @returns String in YYYY-MM-DD format
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Gets current date in Brazil timezone (America/Sao_Paulo)
 * @returns Date object adjusted for Brazil timezone
 */
export function getBrasiliaDate(): Date {
  const now = new Date();
  const brasiliaOffset = -3 * 60; // -3 horas em minutos (UTC-3)
  return new Date(now.getTime() + (brasiliaOffset + now.getTimezoneOffset()) * 60000);
}

/**
 * Gets current day of week in Brazil timezone
 * @returns Number (0=Sunday, 1=Monday, etc.)
 */
export function getBrasiliaDayOfWeek(): number {
  return getBrasiliaDate().getDay();
}