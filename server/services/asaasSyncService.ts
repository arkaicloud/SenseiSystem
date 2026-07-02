/**
 * ASAAS Payment Sync Service
 *
 * Fetches all ASAAS payments into the local `asaas_payment_cache` table.
 * Strategy:
 *   1. For each student with asaasSubscriptionId → GET /v3/subscriptions/{id}/payments
 *   2. Also fetches standalone (non-subscription) payments via GET /v3/payments
 *   3. Enriches with customer name/email (already stored on student record)
 *   4. Upserts everything into the cache table
 *
 * This makes the financial dashboard read from the local DB (fast) instead of
 * calling ASAAS on every page load.
 */

import { storage } from "../storage";
import { AsaasPaymentsService } from "./asaasPaymentsService";

export interface SyncResult {
  subscriptionPayments: number;
  standalonePayments: number;
  total: number;
  studentsProcessed: number;
  errors: string[];
  durationMs: number;
}

export async function syncAsaasPayments(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const allPayments: any[] = [];
  const seenIds = new Set<string>();

  // Instantiate the service using the school's stored API key
  const config = await storage.getSchoolConfig();
  const svc = new AsaasPaymentsService(config?.asaasApiKey || undefined);

  // ── 1. Get all students with subscriptionId ─────────────────────────────────
  const studentsWithUsers = await storage.getStudentsWithUsers();
  const studentsWithSub = studentsWithUsers.filter(
    (sw) => sw.student?.asaasSubscriptionId && sw.student.asaasSubscriptionId.trim() !== ''
  );

  console.log(`🔄 ASAAS Sync: ${studentsWithSub.length} students with subscriptions`);

  // Build lookup: asaasCustomerId → student info
  const customerToStudent = new Map<string, { studentId: number; name: string; email: string }>();
  for (const sw of studentsWithUsers) {
    if (sw.student?.asaasCustomerId) {
      customerToStudent.set(sw.student.asaasCustomerId, {
        studentId: sw.student.id,
        name: sw.user.name ?? sw.user.username,
        email: sw.user.email ?? '',
      });
    }
  }

  // ── 2. Fetch per-subscription payments (correct historical endpoint) ─────────
  const SUBSCRIPTION_CONCURRENCY = 5;
  let subscriptionPaymentCount = 0;

  for (let i = 0; i < studentsWithSub.length; i += SUBSCRIPTION_CONCURRENCY) {
    const batch = studentsWithSub.slice(i, i + SUBSCRIPTION_CONCURRENCY);

    await Promise.all(
      batch.map(async (sw) => {
        const subId = sw.student.asaasSubscriptionId!;
        try {
          const payments = await svc.getSubscriptionPayments(subId);
          console.log(`  📋 sub ${subId}: ${payments.length} payment(s)`);
          for (const p of payments) {
            if (seenIds.has(p.id)) continue;
            seenIds.add(p.id);

            const studentInfo = sw.student.asaasCustomerId
              ? customerToStudent.get(sw.student.asaasCustomerId)
              : undefined;

            allPayments.push({
              ...p,
              customerName:  studentInfo?.name  ?? null,
              customerEmail: studentInfo?.email ?? null,
              studentId:     sw.student.id,
            });
          }
          subscriptionPaymentCount += payments.length;
        } catch (err: any) {
          const msg = `sub ${subId}: ${err.message}`;
          errors.push(msg);
          console.warn(`  ⚠️ ${msg}`);
        }
      })
    );
  }

  // ── 3. Fetch standalone (non-subscription) payments ─────────────────────────
  let standalonePaymentCount = 0;
  try {
    const standalone = await svc.getAllStandalonePayments();
    for (const p of standalone) {
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);

      const studentInfo = p.customer ? customerToStudent.get(p.customer) : undefined;
      allPayments.push({
        ...p,
        customerName:  studentInfo?.name  ?? null,
        customerEmail: studentInfo?.email ?? null,
        studentId:     studentInfo?.studentId ?? null,
      });
      standalonePaymentCount++;
    }
    console.log(`  📋 standalone: ${standalonePaymentCount} unique payment(s) (not in subscriptions)`);
  } catch (err: any) {
    errors.push(`standalone payments: ${err.message}`);
    console.warn(`  ⚠️ standalone payments fetch failed: ${err.message}`);
  }

  // ── 4. Upsert into cache ─────────────────────────────────────────────────────
  const saved = await storage.upsertAsaasPayments(allPayments);
  const durationMs = Date.now() - startTime;

  console.log(`✅ ASAAS Sync complete: ${saved} payments saved in ${durationMs}ms`);

  return {
    subscriptionPayments: subscriptionPaymentCount,
    standalonePayments:   standalonePaymentCount,
    total:                saved,
    studentsProcessed:    studentsWithSub.length,
    errors,
    durationMs,
  };
}
