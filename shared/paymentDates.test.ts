import assert from "node:assert/strict";
import test from "node:test";
import {
  dateKeyInTimeZone,
  isPaymentDateBefore,
  parsePaymentDateAsLocal,
  paymentDateKey,
} from "./paymentDates";

test("mantém a data ASAAS no mesmo dia do calendário local", () => {
  const parsed = parsePaymentDateAsLocal("2026-09-15");
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 8);
  assert.equal(parsed.getDate(), 15);
});

test("não considera a cobrança vencida no próprio dia", () => {
  assert.equal(isPaymentDateBefore("2026-09-15", "2026-09-15"), false);
  assert.equal(isPaymentDateBefore("2026-09-14", "2026-09-15"), true);
});

test("extrai datas de timestamps sem deslocar o dia", () => {
  assert.equal(paymentDateKey("2026-10-15T00:00:00.000Z"), "2026-10-15");
});

test("calcula o dia de Brasília sem depender do fuso do servidor", () => {
  assert.equal(
    dateKeyInTimeZone(new Date("2026-09-15T01:00:00.000Z")),
    "2026-09-14",
  );
});