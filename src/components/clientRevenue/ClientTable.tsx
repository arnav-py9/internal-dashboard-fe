import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { Client, Batch, Payment, DeliveryLog, Settlement } from "../../data/clientRevenueMockData";
import { calcClientMetrics, formatINR } from "../../utils/clientRevenueCalculations";
import ClientDetail from "./ClientDetail";

interface Props {
  clients: Client[];
  batches: Batch[];
  payments: Payment[];
  deliveries: DeliveryLog[];
  settlements: Settlement[];
  onAddClient: () => void; // triggers parent to open AddClientModal
  onAddBatch: (b: Batch) => void;
  onAddPayment: (p: Payment) => void;
  onAddDelivery: (d: DeliveryLog) => void;
  onAddSettlement: (s: Settlement) => void;
  onEndBatch: (batchId: string, reason: string) => void;
}

const ClientTable: React.FC<Props> = ({
  clients, batches, payments, deliveries, settlements,
  onAddClient, onAddBatch, onAddPayment, onAddDelivery, onAddSettlement, onEndBatch,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q) && !c.contactName.toLowerCase().includes(q)) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      return true;
    });
  }, [clients, search, statusFilter]);

  if (selectedClientId) {
    const client = clients.find((c) => c.id === selectedClientId)!;
    return (
      <ClientDetail
        client={client}
        clients={clients}
        batches={batches}
        payments={payments}
        deliveries={deliveries}
        settlements={settlements}
        onBack={() => setSelectedClientId(null)}
        onAddBatch={onAddBatch}
        onAddPayment={onAddPayment}
        onAddDelivery={onAddDelivery}
        onAddSettlement={onAddSettlement}
        onEndBatch={onEndBatch}
      />
    );
  }

  return (
    <div className="table-section">
      <div className="table-header">
        <h2 className="section-title">Clients</h2>
        <div className="table-actions">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="btn-primary" onClick={onAddClient} style={{ padding: "10px 20px", fontSize: 14, borderRadius: 10 }}>
            + Add Client
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table-pro">
          <thead>
            <tr>
              <th>Client</th>
              <th>Active Batch</th>
              <th>Total Batches</th>
              <th>Lifetime Revenue</th>
              <th>Videos Delivered</th>
              <th>Receivable</th>
              <th>Unsettled</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No clients found.</td></tr>
            ) : (
              filtered.map((client) => {
                const m = calcClientMetrics(client.id, batches, payments, deliveries, settlements);
                const clientBatches = batches.filter((b) => b.clientId === client.id);
                const activeBatch = clientBatches.find((b) => b.status === "active");
                return (
                  <tr
                    key={client.id}
                    className="table-row-animated crt-row-clickable"
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    <td>
                      <div className="transaction-details">{client.name}</div>
                      {client.contactName && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{client.contactName}</div>}
                    </td>
                    <td>{activeBatch ? activeBatch.batchName : <span style={{ color: "var(--text-muted)" }}>None</span>}</td>
                    <td>{clientBatches.length}</td>
                    <td className="amount-cell">{formatINR(m.lifetimeRevenue)}</td>
                    <td>{m.totalVideosDelivered}</td>
                    <td className="amount-cell" style={{ color: m.totalReceivable > 0 ? "#d97706" : "inherit" }}>
                      {formatINR(m.totalReceivable)}
                    </td>
                    <td className="amount-cell" style={{ color: m.totalUnsettled > 0 ? "#2563eb" : "inherit" }}>
                      {formatINR(m.totalUnsettled)}
                    </td>
                    <td><span className={`crt-badge ${client.status}`}>{client.status.charAt(0).toUpperCase() + client.status.slice(1)}</span></td>
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

export default ClientTable;
