import React, { useState, useMemo } from "react";
import { ArrowLeft, Video, Banknote, FileCheck2, XCircle } from "lucide-react";
import type {
  Batch, Client, Payment, DeliveryLog, Settlement,
} from "../../data/clientRevenueMockData";
import {
  calcBatchMetrics, formatINR, formatDate,
} from "../../utils/clientRevenueCalculations";
import AddPaymentModal from "./AddPaymentModal";
import AddDeliveryModal from "./AddDeliveryModal";
import AddSettlementModal from "./AddSettlementModal";
import EndBatchModal from "./EndBatchModal";

type Modal = "payment" | "delivery" | "settlement" | "end" | null;

interface Props {
  batch: Batch;
  clients: Client[];
  payments: Payment[];
  deliveries: DeliveryLog[];
  settlements: Settlement[];
  onBack: () => void;
  onAddPayment: (p: Payment) => void;
  onAddDelivery: (d: DeliveryLog) => void;
  onAddSettlement: (s: Settlement) => void;
  onEndBatch: (batchId: string, reason: string) => void;
}

const BatchDetail: React.FC<Props> = ({
  batch, clients, payments, deliveries, settlements,
  onBack, onAddPayment, onAddDelivery, onAddSettlement, onEndBatch,
}) => {
  const [modal, setModal] = useState<Modal>(null);

  const client = clients.find((c) => c.id === batch.clientId);
  const metrics = useMemo(
    () => calcBatchMetrics(batch, payments, deliveries, settlements),
    [batch, payments, deliveries, settlements]
  );

  const batchPayments = payments.filter((p) => p.batchId === batch.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const batchDeliveries = deliveries.filter((d) => d.batchId === batch.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const batchSettlements = settlements.filter((s) => s.batchId === batch.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const progressPct = batch.committedVideos > 0
    ? Math.min(100, (metrics.videosDelivered / batch.committedVideos) * 100)
    : 0;

  const statusLabel: Record<string, string> = {
    active: "Active", completed: "Completed", settled: "Settled",
    ended_early: "Ended Early", cancelled: "Cancelled", draft: "Draft",
  };

  return (
    <div>
      {/* Back */}
      <button className="crt-back-btn" onClick={onBack}>
        <ArrowLeft size={15} /> Back to Batches
      </button>

      {/* Header */}
      <div className="crt-detail-header">
        <div>
          <h2 className="crt-detail-title">{batch.batchName}</h2>
          <p className="crt-detail-subtitle">{client?.name || "Unknown client"}</p>
        </div>
        <span className={`crt-badge ${batch.status}`}>{statusLabel[batch.status] || batch.status}</span>
      </div>

      {/* Meta */}
      <div className="crt-detail-meta">
        <span>Start: <strong>{formatDate(batch.startDate)}</strong></span>
        {batch.expectedEndDate && <span>Expected end: <strong>{formatDate(batch.expectedEndDate)}</strong></span>}
        {batch.endedEarlyReason && <span style={{ color: "#d97706" }}>Reason: {batch.endedEarlyReason}</span>}
      </div>

      {/* Actions */}
      {batch.status === "active" && (
        <div className="crt-batch-actions">
          <button className="crt-action-btn primary" onClick={() => setModal("payment")}>
            <Banknote size={15} /> Add Payment
          </button>
          <button className="crt-action-btn" onClick={() => setModal("delivery")}>
            <Video size={15} /> Mark Videos Completed
          </button>
          <button className="crt-action-btn" onClick={() => setModal("settlement")}>
            <FileCheck2 size={15} /> Add Settlement
          </button>
          <button className="crt-action-btn danger-outline" onClick={() => setModal("end")}>
            <XCircle size={15} /> End Batch Early
          </button>
        </div>
      )}
      {batch.status !== "active" && (
        <div className="crt-batch-actions">
          <button className="crt-action-btn" onClick={() => setModal("settlement")} disabled={metrics.unsettledEarned === 0} title={metrics.unsettledEarned === 0 ? "Nothing to settle" : ""}>
            <FileCheck2 size={15} /> Add Settlement
          </button>
        </div>
      )}

      {/* Progress */}
      <div className="crt-progress-block">
        <p className="crt-progress-numbers">{metrics.videosDelivered} / {batch.committedVideos} videos delivered</p>
        <div className="crt-progress-bar-lg">
          <div className="crt-progress-fill-lg" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="crt-progress-pending">{metrics.pendingVideos} videos pending</p>
      </div>

      {/* Metrics */}
      <div className="crt-metric-grid">
        {[
          { label: "Committed Value", value: formatINR(batch.committedValue) },
          { label: "Per Video", value: formatINR(metrics.perVideoValue) },
          { label: "Cash Received", value: formatINR(metrics.cashReceived) },
          { label: "Earned Revenue", value: formatINR(metrics.earnedRevenue) },
          { label: "Receivable", value: formatINR(metrics.receivable) },
          { label: "Unearned Advance", value: formatINR(metrics.unearnedAdvance) },
          { label: "Unsettled Earned", value: formatINR(metrics.unsettledEarned) },
          { label: "Settled Amount", value: formatINR(metrics.settledAmount) },
        ].map((m) => (
          <div key={m.label} className="crt-metric-box">
            <p className="crt-metric-box-label">{m.label}</p>
            <p className="crt-metric-box-value">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Payments history */}
      <p className="crt-section-heading">Payments</p>
      <div className="table-section" style={{ padding: "1rem 1.5rem" }}>
        {batchPayments.length === 0 ? (
          <p className="crt-empty-mini">No payments recorded.</p>
        ) : (
          batchPayments.map((p) => (
            <div key={p.id} className="crt-log-item">
              <div className="crt-log-dot payment" />
              <span className="crt-log-date">{formatDate(p.date)}</span>
              <span className="crt-log-desc">{formatINR(p.amount)} – received in {p.receivedIn}</span>
              <span className="crt-log-amount">{p.notes}</span>
            </div>
          ))
        )}
      </div>

      {/* Delivery history */}
      <p className="crt-section-heading">Deliveries</p>
      <div className="table-section" style={{ padding: "1rem 1.5rem" }}>
        {batchDeliveries.length === 0 ? (
          <p className="crt-empty-mini">No deliveries recorded.</p>
        ) : (
          batchDeliveries.map((d) => (
            <div key={d.id} className="crt-log-item">
              <div className="crt-log-dot delivery" />
              <span className="crt-log-date">{formatDate(d.date)}</span>
              <span className="crt-log-desc">{d.videosCompleted} video{d.videosCompleted !== 1 ? "s" : ""} completed</span>
              <span className="crt-log-amount">{d.notes}</span>
            </div>
          ))
        )}
      </div>

      {/* Settlements history */}
      <p className="crt-section-heading">Settlements</p>
      <div className="table-section" style={{ padding: "1rem 1.5rem" }}>
        {batchSettlements.length === 0 ? (
          <p className="crt-empty-mini">No settlements recorded.</p>
        ) : (
          batchSettlements.map((s) => (
            <div key={s.id} className="crt-log-item">
              <div className="crt-log-dot settlement" />
              <span className="crt-log-date">{formatDate(s.date)}</span>
              <span className="crt-log-desc">{formatINR(s.amount)} – from {s.fromAccount} to {s.toAccount}</span>
              <span className="crt-log-amount">{s.notes}</span>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {modal === "payment" && (
        <AddPaymentModal batchId={batch.id} batchName={batch.batchName} onClose={() => setModal(null)} onAdd={onAddPayment} />
      )}
      {modal === "delivery" && (
        <AddDeliveryModal batchId={batch.id} batchName={batch.batchName} committedVideos={batch.committedVideos} metrics={metrics} onClose={() => setModal(null)} onAdd={onAddDelivery} />
      )}
      {modal === "settlement" && (
        <AddSettlementModal batchId={batch.id} batchName={batch.batchName} metrics={metrics} onClose={() => setModal(null)} onAdd={onAddSettlement} />
      )}
      {modal === "end" && (
        <EndBatchModal batch={batch} metrics={metrics} onClose={() => setModal(null)} onConfirm={(reason) => onEndBatch(batch.id, reason)} />
      )}
    </div>
  );
};

export default BatchDetail;
