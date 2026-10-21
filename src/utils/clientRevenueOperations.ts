import type {
  Batch,
  Payment,
  DeliveryLog,
  Settlement,
} from "../data/clientRevenueMockData";
import { calcBatchMetrics } from "./clientRevenueCalculations";

export const FX_TOLERANCE = 50;
export function todayIN(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function batchOperations(
  batch: Batch,
  payments: Payment[],
  deliveries: DeliveryLog[],
  settlements: Settlement[],
  today = todayIN(),
) {
  const metrics = calcBatchMetrics(batch, payments, deliveries, settlements);
  const difference = batch.committedValue - metrics.cashReceived;
  // Apply tolerance to a paid contract's final residual, never to an unpaid small contract.
  const fxAdjusted =
    metrics.cashReceived > 0 &&
    difference !== 0 &&
    Math.abs(difference) < FX_TOLERANCE;
  const remaining = fxAdjusted ? 0 : Math.max(difference, 0);
  const credit = fxAdjusted ? 0 : Math.max(-difference, 0);
  const paymentStatus =
    metrics.cashReceived === 0
      ? "Unpaid"
      : credit > 0
        ? "Overpaid"
        : remaining === 0
          ? "Fully paid"
          : "Part-paid";
  const logs = deliveries.filter((d) => d.batchId === batch.id);
  const lastDelivery =
    logs
      .map((d) => d.date)
      .sort()
      .at(-1) || "";
  const age = Math.floor(
    (Date.parse(today + "T00:00:00Z") -
      Date.parse((lastDelivery || batch.startDate) + "T00:00:00Z")) /
      86400000,
  );
  const active = batch.status === "active";
  const overdue =
    active &&
    !!batch.expectedEndDate &&
    batch.expectedEndDate < today &&
    metrics.pendingVideos > 0;
  const needsConfirmation =
    active &&
    metrics.pendingVideos > 0 &&
    (overdue || age >= 7 || (!lastDelivery && metrics.cashReceived > 0));
  const deliveryStatus =
    batch.status === "ended_early"
      ? "Ended early"
      : batch.status === "cancelled"
        ? "Cancelled"
        : batch.status === "draft"
          ? "Draft"
          : metrics.pendingVideos === 0
            ? "Delivered"
            : !lastDelivery
              ? "No delivery recorded"
              : "In progress";
  const nextStep =
    batch.status === "ended_early"
      ? "Review final agreement"
      : batch.status === "cancelled"
        ? "No further work planned"
        : overdue
          ? "Confirm overdue delivery"
          : needsConfirmation
            ? "Confirm delivery with team"
            : remaining > 0
              ? metrics.cashReceived
                ? "Follow up remaining payment"
                : "Record payment when received"
              : metrics.pendingVideos > 0
                ? "Update delivery when confirmed"
                : credit > 0
                  ? "Review client credit"
                  : "All paid and delivered";
  return {
    ...metrics,
    remaining,
    credit,
    fxAdjusted,
    conversionDifference: fxAdjusted ? -difference : 0,
    paymentStatus,
    lastDelivery,
    age,
    overdue,
    needsConfirmation,
    deliveryStatus,
    nextStep,
  };
}
