// Date normalization utilities for ensuring consistent date handling
// Based on Brazil timezone (America/Sao_Paulo)
import {
  calendarDateKey,
  calendarDateKeyInTimeZone,
} from "@shared/calendarDates";

/**
 * Normalizes a date string to 00:00:00 UTC for the given timezone
 * This ensures all dates are stored consistently in the database
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param tz - Timezone (default: America/Sao_Paulo)
 * @returns Date object normalized to start of day in UTC
 */
export function toDayUTC(dateStr: string, tz = "America/Sao_Paulo"): Date {
  // Calendar dates are deliberately stored at UTC midnight in timestamp columns.
  // Do not parse YYYY-MM-DD with Date.parse: that makes the result dependent on
  // the host timezone (and the timezone is not part of a date-only value).
  const key = calendarDateKey(dateStr);
  if (!key) return new Date(dateStr);
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Gets the current date normalized to start of day UTC
 * @param tz - Timezone (default: America/Sao_Paulo)
 * @returns Date object for today at 00:00:00 UTC
 */
export function todayUTC(tz = "America/Sao_Paulo"): Date {
  return toDayUTC(calendarDateKeyInTimeZone(new Date(), tz), tz);
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
  // This returns the current instant. Callers that need a Brasília calendar
  // component must use Intl (see getBrasiliaDayOfWeek), not Date#get*.
  return new Date();
}

/**
 * Gets current day of week in Brazil timezone
 * @returns Number (0=Sunday, 1=Monday, etc.)
 */
export function getBrasiliaDayOfWeek(): number {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}