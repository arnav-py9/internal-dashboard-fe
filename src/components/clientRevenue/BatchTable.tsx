import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type {
  Batch, Client, Payment, DeliveryLog, Settlement,
} from "../../data/clientRevenueMockData";
import { calcBatchMetrics, formatINR } from "../../utils/clientRevenueCalculations";
import BatchDetail from "./BatchDetail";

interface Props {
  batches: Batch[];
  clients: Client[];
  payments: Payment[];
  deliveries: DeliveryLog[];
  settlements: Settlement[];
  onAddPayment: (p: Payment) => void;
  onAddDelivery: (d: DeliveryLog) => void;
  onAddSettlement: (s: Settlement) => void;
  onEndBatch: (batchId: string, reason: string) => void;
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All Statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Settled", value: "settled" },
  { label: "Ended Early", value: "ended_early" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Draft", value: "draft" },
];

const STATUS_LABELS: Record<string, string> = {
  active: "Active", completed: "Completed", settled: "Settled",
  ended_early: "Ended Early", cancelled: "Cancelled", draft: "Draft",
};

const BatchTable: React.FC<Props> = ({
  batches, clients, payments, deliveries, settlements,
  onAddPayment, onAddDelivery, onAddSettlement, onEndBatch,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      const client = clients.find((c) => c.id === b.clientId);
      const name = (client?.name || "").toLowerCase();
      const q = search.toLowerCase();
      if (q && !b.batchName.toLowerCase().includes(q) && !name.includes(q)) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (clientFilter && b.clientId !== clientFilter) return false;
      return true;
    });
  }, [batches, clients, search, statusFilter, clientFilter]);

  if (selectedBatchId) {
    const batch = batches.find((b) => b.id === selectedBatchId)!;
    return (
      <BatchDetail
        batch={batch}
        clients={clients}
        payments={payments}
        deliveries={deliveries}
        settlements={settlements}
        onBack={() => setSelectedBatchId(null)}
        onAddPayment={onAddPayment}
        onAddDelivery={onAddDelivery}
        onAddSettlement={onAddSettlement}
        onEndBatch={(id, reason) => { onEndBatch(id, reason); setSelectedBatchId(null); }}
      />
    );
  }

  return (
    <div className="table-section">
      <div className="table-header">
        <h2 className="section-title">Batches</h2>
        <div className="table-actions">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Search batches…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="select-filter" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table-pro">
          <thead>
            <tr>
              <th>Client</th>
              <th>Batch</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Committed</th>
              <th>Cash Received</th>
              <th>Earned</th>
              <th>Receivable</th>
              <th>Unearned</th>
              <th>Unsettled</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No batches found.</td></tr>
            ) : (
              filtered.map((b) => {
                const client = clients.find((c) => c.id === b.clientId);
                const m = calcBatchMetrics(b, payments, deliveries, settlements);
                const pct = b.committedVideos > 0 ? Math.min(100, (m.videosDelivered / b.committedVideos) * 100) : 0;
                return (
                  <tr key={b.id} className="table-row-animated crt-row-clickable" onClick={() => setSelectedBatchId(b.id)}>
                    <td className="transaction-details">{client?.name || "—"}</td>
                    <td>{b.batchName}</td>
                    <td><span className={`crt-badge ${b.status}`}>{STATUS_LABELS[b.status] || b.status}</span></td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3 }}>{m.videosDelivered} / {b.committedVideos}</div>
                      <div className="crt-progress-bar">
                        <div className="crt-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="amount-cell">{formatINR(b.committedValue)}</td>
                    <td className="amount-cell">{formatINR(m.cashReceived)}</td>
                    <td className="amount-cell">{formatINR(m.earnedRevenue)}</td>
                    <td className="amount-cell" style={{ color: m.receivable > 0 ? "#d97706" : "inherit" }}>{formatINR(m.receivable)}</td>
                    <td className="amount-cell" style={{ color: m.unearnedAdvance > 0 ? "#16a34a" : "inherit" }}>{formatINR(m.unearnedAdvance)}</td>
                    <td className="amount-cell" style={{ color: m.unsettledEarned > 0 ? "#2563eb" : "inherit" }}>{formatINR(m.unsettledEarned)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BatchTable;
