import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import RevenueOverview from "../components/clientRevenue/RevenueOverview";
import ClientTable from "../components/clientRevenue/ClientTable";
import BatchTable from "../components/clientRevenue/BatchTable";
import AddClientModal from "../components/clientRevenue/AddClientModal";
import AddBatchModal from "../components/clientRevenue/AddBatchModal";
import type {
  Client, Batch, Payment, DeliveryLog, Settlement,
} from "../data/clientRevenueMockData";
import "../styles/Dashboard.css";
import "../styles/ClientRevenueTracker.css";

type Tab = "overview" | "clients" | "batches";

const API_BASE = "/api/client-revenue";

const ClientRevenueTracker: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ── State (loaded from the backend) ─────────────────────────────────────────
  const [clients, setClients] = useState<Client[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryLog[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  // ── Fetch data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const userId = localStorage.getItem("user_id");
      if (!userId) { setIsLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/`, { headers: { "user-id": userId } });
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients);
          setBatches(data.batches);
          setPayments(data.payments);
          setDeliveries(data.deliveries);
          setSettlements(data.settlements);
        }
      } catch (e) {
        console.error("ClientRevenueTracker: failed to load data", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleAddClient = async (client: Client) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    const res = await fetch(`${API_BASE}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "user-id": userId },
      body: JSON.stringify(client),
    });
    if (!res.ok) { console.error("Failed to add client"); return; }
    const saved: Client = await res.json();
    setClients((prev) => [saved, ...prev]);
  };

  const handleAddBatch = async (batch: Batch) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    const res = await fetch(`${API_BASE}/batches`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "user-id": userId },
      body: JSON.stringify(batch),
    });
    if (!res.ok) { console.error("Failed to add batch"); return; }
    const saved: Batch = await res.json();
    setBatches((prev) => [saved, ...prev]);
  };

  const handleAddPayment = async (payment: Payment) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    const res = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "user-id": userId },
      body: JSON.stringify(payment),
    });
    if (!res.ok) { console.error("Failed to add payment"); return; }
    const saved: Payment = await res.json();
    setPayments((prev) => [saved, ...prev]);
  };

  const handleAddDelivery = async (delivery: DeliveryLog) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    const res = await fetch(`${API_BASE}/deliveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "user-id": userId },
      body: JSON.stringify(delivery),
    });
    if (!res.ok) { console.error("Failed to add delivery"); return; }
    const saved: DeliveryLog = await res.json();
    setDeliveries((prev) => [saved, ...prev]);
    const previouslyDelivered = deliveries
      .filter((item) => item.batchId === saved.batchId)
      .reduce((total, item) => total + item.videosCompleted, 0);
    setBatches((prev) => prev.map((batch) => (
      batch.id === saved.batchId && previouslyDelivered + saved.videosCompleted >= batch.committedVideos
        ? { ...batch, status: "completed" }
        : batch
    )));
  };

  const handleAddSettlement = async (settlement: Settlement) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    const res = await fetch(`${API_BASE}/settlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "user-id": userId },
      body: JSON.stringify(settlement),
    });
    if (!res.ok) { console.error("Failed to add settlement"); return; }
    const saved: Settlement = await res.json();
    setSettlements((prev) => [saved, ...prev]);
  };

  const handleEndBatch = async (batchId: string, reason: string) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    const res = await fetch(`${API_BASE}/batches/${batchId}/end`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "user-id": userId },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) { console.error("Failed to end batch"); return; }
    const updated: Batch = await res.json();
    setBatches((prev) => prev.map((b) => (b.id === batchId ? updated : b)));
  };

  return (
    <div className="dashboard">
      <Navbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} currentPage="client-revenue" />
        <main className="dashboard-main">
          {isLoading ? (
            <div className="crt-loading">
              <div className="crt-spinner" />
              <p>Loading client revenue data…</p>
            </div>
          ) : (
            <>
              {/* ── Page Header ── */}
              <div className="page-header">
                <div className="header-content">
                  <h1 className="page-title">Client Revenue Tracker</h1>
                  <p className="page-description">
                    Track client batches, payments, delivered videos, earned revenue, receivables, and settlements.
                  </p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddClient(true)}>
                  + Add Client
                </button>
              </div>

              {/* ── Tabs ── */}
              <div className="crt-tabs">
                {(["overview", "clients", "batches"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    className={`crt-tab${activeTab === t ? " active" : ""}`}
                    onClick={() => setActiveTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* ── Tab Content ── */}
              {activeTab === "overview" && (
                <RevenueOverview
                  clients={clients}
                  batches={batches}
                  payments={payments}
                  deliveries={deliveries}
                  settlements={settlements}
                />
              )}

              {activeTab === "clients" && (
                <ClientTable
                  clients={clients}
                  batches={batches}
                  payments={payments}
                  deliveries={deliveries}
                  settlements={settlements}
                  onAddClient={() => setShowAddClient(true)}
                  onAddBatch={handleAddBatch}
                  onAddPayment={handleAddPayment}
                  onAddDelivery={handleAddDelivery}
                  onAddSettlement={handleAddSettlement}
                  onEndBatch={handleEndBatch}
                />
              )}

              {activeTab === "batches" && (
                <BatchTable
                  batches={batches}
                  clients={clients}
                  payments={payments}
                  deliveries={deliveries}
                  settlements={settlements}
                  onAddPayment={handleAddPayment}
                  onAddDelivery={handleAddDelivery}
                  onAddSettlement={handleAddSettlement}
                  onEndBatch={handleEndBatch}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Global Modals ── */}
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onAdd={handleAddClient}
        />
      )}
      {showAddBatch && (
        <AddBatchModal
          clients={clients}
          batches={batches}
          onClose={() => setShowAddBatch(false)}
          onAdd={handleAddBatch}
        />
      )}
    </div>
  );
};

export default ClientRevenueTracker;
