export function calendarDateKey(
  value: string | Date | null | undefined,
): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export function parseCalendarDateAsLocal(value: string | Date): Date {
  const key = calendarDateKey(value);
  if (!key) return new Date(String(value));
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function localCalendarDateKey(value = new Date()): string {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

export function shiftCalendarDateKey(value: string, days: number): string {
  const key = calendarDateKey(value);
  if (!key) return value;
  const [year, month, day] = key.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

export function calendarDayOfWeek(value: string): number {
  const key = calendarDateKey(value);
  if (!key) return NaN;
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function calendarDayDifference(
  fromDate: string | Date,
  toDate: string | Date,
): number | null {
  const fromKey = calendarDateKey(fromDate);
  const toKey = calendarDateKey(toDate);
  if (!fromKey || !toKey) return null;
  const [fromYear, fromMonth, fromDay] = fromKey.split("-").map(Number);
  const [toYear, toMonth, toDay] = toKey.split("-").map(Number);
  return Math.round(
    (Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) /
    (24 * 60 * 60 * 1000),
  );
}

export function calendarDateKeyInTimeZone(
  value: Date,
  timeZone = "America/Sao_Paulo",
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isCalendarDateBefore(
  value: string | Date,
  comparisonDateKey: string,
): boolean {
  const valueKey = calendarDateKey(value);
  return !!valueKey && valueKey < comparisonDateKey;
}