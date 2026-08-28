import React, { useState, useMemo } from "react";
import { ArrowLeft, PlusCircle, Video, Banknote, FileCheck2 } from "lucide-react";
import type {
  Client, Batch, Payment, DeliveryLog, Settlement,
} from "../../data/clientRevenueMockData";
import {
  calcBatchMetrics, calcClientMetrics, formatINR, formatDate,
} from "../../utils/clientRevenueCalculations";
import AddBatchModal from "./AddBatchModal";
import AddPaymentModal from "./AddPaymentModal";
import AddDeliveryModal from "./AddDeliveryModal";
import AddSettlementModal from "./AddSettlementModal";
import EndBatchModal from "./EndBatchModal";

type Modal = "batch" | "payment" | "delivery" | "settlement" | "end" | null;

interface Props {
  client: Client;
  clients: Client[];
  batches: Batch[];
  payments: Payment[];
  deliveries: DeliveryLog[];
  settlements: Settlement[];
  onBack: () => void;
  onAddBatch: (b: Batch) => void;
  onAddPayment: (p: Payment) => void;
  onAddDelivery: (d: DeliveryLog) => void;
  onAddSettlement: (s: Settlement) => void;
  onEndBatch: (batchId: string, reason: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active", completed: "Completed", settled: "Settled",
  ended_early: "Ended Early", cancelled: "Cancelled", draft: "Draft",
};

const ClientDetail: React.FC<Props> = ({
  client, clients, batches, payments, deliveries, settlements,
  onBack, onAddBatch, onAddPayment, onAddDelivery, onAddSettlement, onEndBatch,
}) => {
  const [modal, setModal] = useState<Modal>(null);

  const clientBatches = useMemo(
    () => batches.filter((b) => b.clientId === client.id).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [batches, client.id]
  );

  const clientMetrics = useMemo(
    () => calcClientMetrics(client.id, batches, payments, deliveries, settlements),
    [client.id, batches, payments, deliveries, settlements]
  );

  const activeBatch = clientBatches.find((b) => b.status === "active") || null;
  const activeBatchMetrics = activeBatch
    ? calcBatchMetrics(activeBatch, payments, deliveries, settlements)
    : null;
  const activeProgressPct = activeBatch && activeBatchMetrics
    ? Math.min(100, (activeBatchMetrics.videosDelivered / activeBatch.committedVideos) * 100)
    : 0;

  return (
    <div>
      {/* Back */}
      <button className="crt-back-btn" onClick={onBack}>
        <ArrowLeft size={15} /> Back to Clients
      </button>

      {/* Header */}
      <div className="crt-detail-header">
        <div>
          <h2 className="crt-detail-title">{client.name}</h2>
          <p className="crt-detail-subtitle">{client.status === "active" ? "Active client" : "Inactive client"}</p>
        </div>
        <span className={`crt-badge ${client.status}`}>{client.status.charAt(0).toUpperCase() + client.status.slice(1)}</span>
      </div>

      {/* Contact meta */}
      {(client.contactName || client.contactEmail || client.contactPhone) && (
        <div className="crt-detail-meta">
          {client.contactName && <span className="crt-detail-meta-item">👤 {client.contactName}</span>}
          {client.contactEmail && <span className="crt-detail-meta-item">✉ {client.contactEmail}</span>}
          {client.contactPhone && <span className="crt-detail-meta-item">📞 {client.contactPhone}</span>}
        </div>
      )}

      {/* Summary cards */}
      <div className="crt-mini-cards">
        <div className="crt-mini-card">
          <p className="crt-mini-card-label">Lifetime Revenue</p>
          <p className="crt-mini-card-value">{formatINR(clientMetrics.lifetimeRevenue)}</p>
        </div>
        <div className="crt-mini-card">
          <p className="crt-mini-card-label">Videos Delivered</p>
          <p className="crt-mini-card-value">{clientMetrics.totalVideosDelivered}</p>
        </div>
        <div className="crt-mini-card">
          <p className="crt-mini-card-label">Total Receivable</p>
          <p className="crt-mini-card-value">{formatINR(clientMetrics.totalReceivable)}</p>
        </div>
        <div className="crt-mini-card">
          <p className="crt-mini-card-label">Unsettled</p>
          <p className="crt-mini-card-value">{formatINR(clientMetrics.totalUnsettled)}</p>
        </div>
      </div>

      {/* Active Batch */}
      {activeBatch && activeBatchMetrics ? (
        <>
          <p className="crt-section-heading">Active Batch</p>
          <div className="crt-progress-block">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>{activeBatch.batchName}</p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Started {formatDate(activeBatch.startDate)}</p>
              </div>
              <span className="crt-badge active">Active</span>
            </div>
            <p className="crt-progress-numbers">{activeBatchMetrics.videosDelivered} / {activeBatch.committedVideos} videos</p>
            <div className="crt-progress-bar-lg">
              <div className="crt-progress-fill-lg" style={{ width: `${activeProgressPct}%` }} />
            </div>
            <p className="crt-progress-pending">{activeBatchMetrics.pendingVideos} videos pending</p>

            <div className="crt-metric-grid" style={{ marginTop: "1rem" }}>
              {[
                { label: "Committed Value", value: formatINR(activeBatch.committedValue) },
                { label: "Cash Received", value: formatINR(activeBatchMetrics.cashReceived) },
                { label: "Earned Revenue", value: formatINR(activeBatchMetrics.earnedRevenue) },
                { label: "Receivable", value: formatINR(activeBatchMetrics.receivable) },
                { label: "Unearned Advance", value: formatINR(activeBatchMetrics.unearnedAdvance) },
                { label: "Unsettled Earned", value: formatINR(activeBatchMetrics.unsettledEarned) },
              ].map((m) => (
                <div key={m.label} className="crt-metric-box">
                  <p className="crt-metric-box-label">{m.label}</p>
                  <p className="crt-metric-box-value">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="crt-batch-actions" style={{ marginBottom: 0, marginTop: "1rem" }}>
              <button className="crt-action-btn primary" onClick={() => setModal("payment")}><Banknote size={15} /> Add Payment</button>
              <button className="crt-action-btn" onClick={() => setModal("delivery")}><Video size={15} /> Mark Videos Completed</button>
              <button className="crt-action-btn" onClick={() => setModal("settlement")}><FileCheck2 size={15} /> Add Settlement</button>
              <button className="crt-action-btn danger-outline" onClick={() => setModal("end")}>End Batch Early</button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ marginBottom: "1.5rem" }}>
          <p className="crt-section-heading">Active Batch</p>
          <div className="crt-empty-mini">No active batch. <button className="crt-action-btn primary" onClick={() => setModal("batch")} style={{ display: "inline-flex", marginLeft: 8 }}><PlusCircle size={14} /> Add Batch</button></div>
        </div>
      )}

      {/* Actions bar */}
      <div className="crt-batch-actions">
        <button className="crt-action-btn primary" onClick={() => setModal("batch")}><PlusCircle size={15} /> Add Batch</button>
      </div>

      {/* Batch History */}
      <p className="crt-section-heading">Batch History</p>
      <div className="table-section">
        <div className="table-wrapper">
          <table className="table-pro">
            <thead>
              <tr>
                <th>Batch</th>
                <th>Start Date</th>
                <th>Videos</th>
                <th>Committed</th>
                <th>Earned</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clientBatches.map((b) => {
                const m = calcBatchMetrics(b, payments, deliveries, settlements);
                return (
                  <tr key={b.id} className="table-row-animated">
                    <td className="transaction-details">{b.batchName}</td>
                    <td className="date-cell">{formatDate(b.startDate)}</td>
                    <td>{m.videosDelivered} / {b.committedVideos}</td>
                    <td className="amount-cell">{formatINR(b.committedValue)}</td>
                    <td className="amount-cell">{formatINR(m.earnedRevenue)}</td>
                    <td><span className={`crt-badge ${b.status}`}>{STATUS_LABELS[b.status] || b.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal === "batch" && (
        <AddBatchModal clients={clients} batches={batches} defaultClientId={client.id} onClose={() => setModal(null)} onAdd={onAddBatch} />
      )}
      {modal === "payment" && activeBatch && (
        <AddPaymentModal batchId={activeBatch.id} batchName={activeBatch.batchName} onClose={() => setModal(null)} onAdd={onAddPayment} />
      )}
      {modal === "delivery" && activeBatch && activeBatchMetrics && (
        <AddDeliveryModal batchId={activeBatch.id} batchName={activeBatch.batchName} committedVideos={activeBatch.committedVideos} metrics={activeBatchMetrics} onClose={() => setModal(null)} onAdd={onAddDelivery} />
      )}
      {modal === "settlement" && activeBatch && activeBatchMetrics && (
        <AddSettlementModal batchId={activeBatch.id} batchName={activeBatch.batchName} metrics={activeBatchMetrics} onClose={() => setModal(null)} onAdd={onAddSettlement} />
      )}
      {modal === "end" && activeBatch && activeBatchMetrics && (
        <EndBatchModal batch={activeBatch} metrics={activeBatchMetrics} onClose={() => setModal(null)} onConfirm={(reason) => { onEndBatch(activeBatch.id, reason); setModal(null); }} />
      )}
    </div>
  );
};

export default ClientDetail;
