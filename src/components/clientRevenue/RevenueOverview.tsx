import React, { useMemo } from "react";
import {
  TrendingUp, Banknote, Video, Layers, AlertCircle, ArrowUpFromLine, FileCheck2,
} from "lucide-react";
import type { Batch, Client, Payment, DeliveryLog, Settlement } from "../../data/clientRevenueMockData";
import {
  calcOverviewMetrics, calcBatchMetrics, formatINR, formatDate,
} from "../../utils/clientRevenueCalculations";

interface Props {
  clients: Client[];
  batches: Batch[];
  payments: Payment[];
  deliveries: DeliveryLog[];
  settlements: Settlement[];
}

interface Activity {
  id: string;
  clientName: string;
  type: "delivery" | "payment" | "settlement";
  description: string;
  amount?: number;
  date: string;
}

const RevenueOverview: React.FC<Props> = ({ clients, batches, payments, deliveries, settlements }) => {
  const metrics = useMemo(
    () => calcOverviewMetrics(batches, payments, deliveries, settlements),
    [batches, payments, deliveries, settlements]
  );

  const activeBatches = useMemo(
    () => batches.filter((b) => b.status === "active"),
    [batches]
  );

  // Build recent activity from payments, deliveries, settlements
  const recentActivity = useMemo((): Activity[] => {
    const items: Activity[] = [];
    payments.forEach((p) => {
      const batch = batches.find((b) => b.id === p.batchId);
      const client = clients.find((c) => c.id === batch?.clientId);
      items.push({ id: p.id, clientName: client?.name || "Unknown", type: "payment", description: `Payment received in ${p.receivedIn}`, amount: p.amount, date: p.date });
    });
    deliveries.forEach((d) => {
      const batch = batches.find((b) => b.id === d.batchId);
      const client = clients.find((c) => c.id === batch?.clientId);
      items.push({ id: d.id, clientName: client?.name || "Unknown", type: "delivery", description: `${d.videosCompleted} video${d.videosCompleted !== 1 ? "s" : ""} delivered`, date: d.date });
    });
    settlements.forEach((s) => {
      const batch = batches.find((b) => b.id === s.batchId);
      const client = clients.find((c) => c.id === batch?.clientId);
      items.push({ id: s.id, clientName: client?.name || "Unknown", type: "settlement", description: `Settlement added`, amount: s.amount, date: s.date });
    });
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }, [payments, deliveries, settlements, batches, clients]);

  const kpiCards = [
    { label: "Revenue Earned This Month", value: formatINR(metrics.revenueEarnedThisMonth), sub: "Based on videos delivered", icon: <TrendingUp size={18} />, variant: "info" },
    { label: "Cash Received This Month", value: formatINR(metrics.cashReceivedThisMonth), sub: "Client payments received", icon: <Banknote size={18} />, variant: "success" },
    { label: "Videos Delivered This Month", value: `${metrics.videosDeliveredThisMonth}`, sub: "Across active batches", icon: <Video size={18} />, variant: "" },
    { label: "Active Batches", value: `${metrics.activeBatches}`, sub: "Currently in progress", icon: <Layers size={18} />, variant: "" },
    { label: "Total Receivables", value: formatINR(metrics.totalReceivables), sub: "Earned but unpaid", icon: <AlertCircle size={18} />, variant: "warn" },
    { label: "Unearned Client Advances", value: formatINR(metrics.unearnedAdvances), sub: "Paid for undelivered work", icon: <ArrowUpFromLine size={18} />, variant: "" },
    { label: "Unsettled Earned Revenue", value: formatINR(metrics.unsettledEarned), sub: "Earned but not settled to business", icon: <FileCheck2 size={18} />, variant: "info" },
  ];

  return (
    <div>
      {/* KPI Cards */}
      <div className="crt-kpi-grid">
        {kpiCards.map((c) => (
          <div key={c.label} className={`crt-stat-card ${c.variant}`}>
            <div className="crt-stat-icon">{c.icon}</div>
            <p className="crt-stat-label">{c.label}</p>
            <p className="crt-stat-value">{c.value}</p>
            <p className="crt-stat-sub">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="crt-two-col">
        {/* Recent Activity */}
        <div className="table-section">
          <div className="table-header">
            <h2 className="section-title">Recent Client Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="crt-empty-mini">No activity yet.</p>
          ) : (
            <ul className="crt-activity-list">
              {recentActivity.map((a) => (
                <li key={a.id} className="crt-activity-item">
                  <div className={`crt-activity-dot ${a.type}`} />
                  <div className="crt-activity-body">
                    <p className="crt-activity-title">{a.clientName}</p>
                    <p className="crt-activity-desc">
                      {a.description}
                      {a.amount ? ` · ${formatINR(a.amount)}` : ""}
                    </p>
                  </div>
                  <span className="crt-activity-date">{formatDate(a.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active Batches */}
        <div className="table-section">
          <div className="table-header">
            <h2 className="section-title">Active Batches</h2>
          </div>
          {activeBatches.length === 0 ? (
            <p className="crt-empty-mini">No active batches.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table-pro">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Batch</th>
                    <th>Progress</th>
                    <th>Committed</th>
                    <th>Earned</th>
                    <th>Receivable</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBatches.map((b) => {
                    const client = clients.find((c) => c.id === b.clientId);
                    const m = calcBatchMetrics(b, payments, deliveries, settlements);
                    const pct = b.committedVideos > 0 ? Math.min(100, (m.videosDelivered / b.committedVideos) * 100) : 0;
                    return (
                      <tr key={b.id} className="table-row-animated">
                        <td className="transaction-details">{client?.name || "—"}</td>
                        <td>{b.batchName}</td>
                        <td style={{ minWidth: 110 }}>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 3 }}>{m.videosDelivered} / {b.committedVideos}</div>
                          <div className="crt-progress-bar">
                            <div className="crt-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="amount-cell">{formatINR(b.committedValue)}</td>
                        <td className="amount-cell">{formatINR(m.earnedRevenue)}</td>
                        <td className="amount-cell" style={{ color: m.receivable > 0 ? "#d97706" : "inherit" }}>{formatINR(m.receivable)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueOverview;
