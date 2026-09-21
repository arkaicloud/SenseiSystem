import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarDateKey,
  calendarDateKeyInTimeZone,
  calendarDayDifference,
  calendarDayOfWeek,
  parseCalendarDateAsLocal,
  shiftCalendarDateKey,
} from "./calendarDates";

test("preserva datas de calendário sem interpretá-las como UTC", () => {
  assert.equal(calendarDateKey("2026-09-15"), "2026-09-15");
  const localDate = parseCalendarDateAsLocal("2026-09-15");
  assert.equal(localDate.getFullYear(), 2026);
  assert.equal(localDate.getMonth(), 8);
  assert.equal(localDate.getDate(), 15);
});

test("converte instantes nas fronteiras do dia de Brasília", () => {
  assert.equal(
    calendarDateKeyInTimeZone(new Date("2026-09-15T02:59:59.999Z")),
    "2026-09-14",
  );
  assert.equal(
    calendarDateKeyInTimeZone(new Date("2026-09-15T03:00:00.000Z")),
    "2026-09-15",
  );
});

test("faz aritmética e comparação de dias sem depender do fuso do host", () => {
  assert.equal(shiftCalendarDateKey("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftCalendarDateKey("2026-12-31", 1), "2027-01-01");
  assert.equal(calendarDayOfWeek("2026-09-21"), 1);
  assert.equal(calendarDayDifference("2026-09-15", "2026-09-21"), 6);
});

test("rejeita entradas inválidas em operações de calendário", () => {
  assert.equal(calendarDateKey("not-a-date"), null);
  assert.equal(calendarDateKey(new Date("invalid")), null);
  assert.equal(calendarDayDifference("not-a-date", "2026-09-21"), null);
});