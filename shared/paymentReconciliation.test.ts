import assert from "node:assert/strict";
import test from "node:test";
import { reconcileFamilyPayments } from "./paymentReconciliation";

test("prioriza pagamento recebido sobre duplicata pendente do mesmo mês e valor", () => {
  const result = reconcileFamilyPayments([
    { id: "paid", status: "RECEIVED", value: 9000, dueDate: "2026-09-15", externalReference: "family_1" },
    { id: "duplicate", status: "OVERDUE", value: 9000, dueDate: "2026-09-14", externalReference: "family_1" },
  ]);
  assert.deepEqual(result.map((payment) => payment.id), ["paid"]);
});

test("não esconde cobranças pendentes sem pagamento correspondente", () => {
  const result = reconcileFamilyPayments([
    { id: "pending", status: "PENDING", value: 9000, dueDate: "2026-10-15" },
  ]);
  assert.equal(result.length, 1);
});

test("preserva mensalidades iguais de alunos diferentes", () => {
  const result = reconcileFamilyPayments([
    { id: "paid-a", status: "RECEIVED", value: 9000, dueDate: "2026-09-15", externalReference: "student_a" },
    { id: "due-b", status: "OVERDUE", value: 9000, dueDate: "2026-09-15", externalReference: "student_b" },
  ]);
  assert.deepEqual(result.map((payment) => payment.id), ["paid-a", "due-b"]);
});

test("pagamento estornado não quita outra cobrança", () => {
  const result = reconcileFamilyPayments([
    { id: "refunded", status: "REFUNDED", value: 9000, dueDate: "2026-09-15", externalReference: "family_1" },
    { id: "due", status: "OVERDUE", value: 9000, dueDate: "2026-09-15", externalReference: "family_1" },
  ]);
  assert.deepEqual(result.map((payment) => payment.id), ["refunded", "due"]);
});