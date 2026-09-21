import { paymentDateKey } from "./paymentDates";

interface ReconciliationPayment {
  id: string | number;
  status: string;
  value: number;
  dueDate: string | Date;
  externalReference?: string | null;
  subscription?: string | null;
}

const PAID_STATUSES = new Set([
  "RECEIVED",
  "CONFIRMED",
  "RECEIVED_IN_CASH",
]);

function obligationGroup(payment: ReconciliationPayment): string | null {
  const obligationId = payment.externalReference || payment.subscription;
  const dueMonth = paymentDateKey(payment.dueDate)?.slice(0, 7);
  if (!obligationId || !dueMonth) return null;
  return `${obligationId}:${dueMonth}:${Number(payment.value)}`;
}

export function reconcileFamilyPayments<T extends ReconciliationPayment>(
  payments: T[],
): T[] {
  const paidGroups = new Set(
    payments
      .filter((payment) => PAID_STATUSES.has(payment.status.toUpperCase()))
      .map(obligationGroup)
      .filter((group): group is string => !!group),
  );

  return payments.filter((payment) => {
    if (PAID_STATUSES.has(payment.status.toUpperCase())) return true;
    const group = obligationGroup(payment);
    return !group || !paidGroups.has(group);
  });
}