// ─── Calculation helpers ───────────────────────────────────────────────────────
// All business logic is centralised here so swapping mock state for API calls
// later only requires touching this file (or replacing it with API responses).

import type { Batch, Payment, DeliveryLog, Settlement } from "../data/clientRevenueMockData";

// ── Formatting ──────────────────────────────────────────────────────────────────

/** Format a number as Indian Rupees with lakh-comma notation, e.g. ₹1,50,000 */
export function formatINR(value: number): string {
  if (value === 0) return "₹0";
  const str = Math.round(Math.abs(value)).toString();
  // Indian grouping: last 3 digits, then groups of 2
  const len = str.length;
  if (len <= 3) return `₹${value < 0 ? "-" : ""}${str}`;
  const last3 = str.slice(len - 3);
  const rest = str.slice(0, len - 3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${value < 0 ? "-" : ""}₹${grouped},${last3}`;
}

/** Format a date string as "Aug 20, 2026" */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

// ── Per-batch metrics ──────────────────────────────────────────────────────────

export interface BatchMetrics {
  perVideoValue: number;
  videosDelivered: number;
  pendingVideos: number;
  earnedRevenue: number;
  cashReceived: number;
  receivable: number;
  unearnedAdvance: number;
  settledAmount: number;
  unsettledEarned: number;
  unrealizedValue: number;
}

export function calcBatchMetrics(
  batch: Batch,
  payments: Payment[],
  deliveryLogs: DeliveryLog[],
  settlements: Settlement[]
): BatchMetrics {
  const batchPayments = payments.filter((p) => p.batchId === batch.id);
  const batchDeliveries = deliveryLogs.filter((d) => d.batchId === batch.id);
  const batchSettlements = settlements.filter((s) => s.batchId === batch.id);

  const perVideoValue =
    batch.committedVideos > 0 ? batch.committedValue / batch.committedVideos : 0;

  const videosDelivered = batchDeliveries.reduce((sum, d) => sum + d.videosCompleted, 0);
  const pendingVideos = Math.max(batch.committedVideos - videosDelivered, 0);
  const earnedRevenue = videosDelivered * perVideoValue;

  const cashReceived = batchPayments.reduce((sum, p) => sum + p.amount, 0);
  const receivable = Math.max(earnedRevenue - cashReceived, 0);
  const unearnedAdvance = Math.max(cashReceived - earnedRevenue, 0);

  const settledAmount = batchSettlements.reduce((sum, s) => sum + s.amount, 0);
  const unsettledEarned = Math.max(earnedRevenue - settledAmount, 0);

  const unrealizedValue = batch.committedValue - earnedRevenue;

  return {
    perVideoValue,
    videosDelivered,
    pendingVideos,
    earnedRevenue,
    cashReceived,
    receivable,
    unearnedAdvance,
    settledAmount,
    unsettledEarned,
    unrealizedValue,
  };
}

// ── Per-client aggregates ──────────────────────────────────────────────────────

export interface ClientMetrics {
  lifetimeRevenue: number;
  totalVideosDelivered: number;
  totalReceivable: number;
  totalUnsettled: number;
  activeBatchId: string | null;
}

export function calcClientMetrics(
  clientId: string,
  batches: Batch[],
  payments: Payment[],
  deliveryLogs: DeliveryLog[],
  settlements: Settlement[]
): ClientMetrics {
  const clientBatches = batches.filter((b) => b.clientId === clientId);

  let lifetimeRevenue = 0;
  let totalVideosDelivered = 0;
  let totalReceivable = 0;
  let totalUnsettled = 0;
  let activeBatchId: string | null = null;

  for (const batch of clientBatches) {
    const m = calcBatchMetrics(batch, payments, deliveryLogs, settlements);
    lifetimeRevenue += m.earnedRevenue;
    totalVideosDelivered += m.videosDelivered;
    totalReceivable += m.receivable;
    totalUnsettled += m.unsettledEarned;
    if (batch.status === "active" && activeBatchId === null) {
      activeBatchId = batch.id;
    }
  }

  return { lifetimeRevenue, totalVideosDelivered, totalReceivable, totalUnsettled, activeBatchId };
}

// ── Global overview metrics (current month) ────────────────────────────────────

export interface OverviewMetrics {
  revenueEarnedThisMonth: number;
  cashReceivedThisMonth: number;
  videosDeliveredThisMonth: number;
  activeBatches: number;
  totalReceivables: number;
  unearnedAdvances: number;
  unsettledEarned: number;
}

export function calcOverviewMetrics(
  batches: Batch[],
  payments: Payment[],
  deliveryLogs: DeliveryLog[],
  settlements: Settlement[]
): OverviewMetrics {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let revenueEarnedThisMonth = 0;
  let cashReceivedThisMonth = 0;
  let videosDeliveredThisMonth = 0;
  let activeBatches = 0;
  let totalReceivables = 0;
  let unearnedAdvances = 0;
  let unsettledEarned = 0;

  for (const batch of batches) {
    const m = calcBatchMetrics(batch, payments, deliveryLogs, settlements);

    if (batch.status === "active") activeBatches++;
    totalReceivables += m.receivable;
    unearnedAdvances += m.unearnedAdvance;
    unsettledEarned += m.unsettledEarned;

    // This-month payments
    const monthPayments = payments.filter(
      (p) => p.batchId === batch.id && p.date.startsWith(thisMonth)
    );
    cashReceivedThisMonth += monthPayments.reduce((s, p) => s + p.amount, 0);

    // This-month deliveries
    const monthDeliveries = deliveryLogs.filter(
      (d) => d.batchId === batch.id && d.date.startsWith(thisMonth)
    );
    const monthVideos = monthDeliveries.reduce((s, d) => s + d.videosCompleted, 0);
    videosDeliveredThisMonth += monthVideos;
    revenueEarnedThisMonth += monthVideos * m.perVideoValue;
  }

  return {
    revenueEarnedThisMonth,
    cashReceivedThisMonth,
    videosDeliveredThisMonth,
    activeBatches,
    totalReceivables,
    unearnedAdvances,
    unsettledEarned,
  };
}
