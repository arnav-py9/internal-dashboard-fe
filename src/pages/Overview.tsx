import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingDown,
  DollarSign,
  Filter,
  X,
  CalendarRange,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import "../styles/Dashboard.css";
import "../styles/Overview.css";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Transaction {
  _id: string;
  user_id: string;
  details: string;
  type: "income" | "expense";
  date: string;
  amount: number;
  category: string;
  payee?: string;
}

interface BusinessProfitEntry {
  _id: string;
  user_id: string;
  category: string;
  amount: number;
  date: string;
  details?: string;
}

interface BusinessProfitResponse {
  total_profit: number;
  entries: BusinessProfitEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatINR = (v: number) =>
  `₹${v >= 1_00_000 ? `${(v / 1_00_000).toFixed(1)}L` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : v.toLocaleString()}`;

// ─── Component ────────────────────────────────────────────────────────────────

const Overview: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profitData, setProfitData] = useState<BusinessProfitResponse>({ total_profit: 0, entries: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Date range filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [filterActive, setFilterActive] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // ── Fetch data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const userId = localStorage.getItem("user_id");
      if (!userId) { setIsLoading(false); return; }
      try {
        const [txnRes, profitRes] = await Promise.all([
          fetch("/api/users-transactions/", { headers: { "user-id": userId } }),
          fetch("/api/users-business-profit/", { headers: { "user-id": userId } }),
        ]);
        if (txnRes.ok) setTransactions(await txnRes.json());
        if (profitRes.ok) setProfitData(await profitRes.json());
      } catch (e) {
        console.error("Overview: failed to load data", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Apply / Clear filter ─────────────────────────────────────────────────────
  const handleApplyFilter = () => {
    if (!startDate && !endDate) return;
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setFilterActive(true);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setAppliedStart("");
    setAppliedEnd("");
    setFilterActive(false);
  };

  // ── Filtered datasets ────────────────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    if (!filterActive) return transactions;
    const from = appliedStart ? new Date(appliedStart) : null;
    const to = appliedEnd ? new Date(appliedEnd) : null;
    return transactions.filter((t) => {
      const d = new Date(t.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [transactions, filterActive, appliedStart, appliedEnd]);

  const filteredProfitEntries = useMemo(() => {
    if (!filterActive) return profitData.entries;
    const from = appliedStart ? new Date(appliedStart) : null;
    const to = appliedEnd ? new Date(appliedEnd) : null;
    return profitData.entries.filter((e) => {
      const d = new Date(e.date);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [profitData.entries, filterActive, appliedStart, appliedEnd]);

  // ── KPI calculations ─────────────────────────────────────────────────────────
  const totalExpenses = useMemo(
    () => filteredTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );
  const totalProfit = useMemo(
    () => filteredProfitEntries.reduce((s, e) => s + e.amount, 0),
    [filteredProfitEntries]
  );

  // ── Daily chart data (Transactions vs Profit) ──────────────────────────────
  const dailyChartData = useMemo(() => {
    const map: Record<string, { date: string; transactions: number; profit: number }> = {};

    // If filter is active, we should show the full range from start to end
    if (filterActive && appliedStart && appliedEnd) {
      const start = new Date(appliedStart);
      const end = new Date(appliedEnd);
      const current = new Date(start);
      
      while (current <= end) {
        const key = current.toISOString().slice(0, 10);
        map[key] = { date: key, transactions: 0, profit: 0 };
        current.setDate(current.getDate() + 1);
      }
    }

    filteredTransactions.forEach((t) => {
      const key = t.date.slice(0, 10);
      if (!map[key]) map[key] = { date: key, transactions: 0, profit: 0 };
      map[key].transactions += t.amount;
    });

    filteredProfitEntries.forEach((e) => {
      const key = e.date.slice(0, 10);
      if (!map[key]) map[key] = { date: key, transactions: 0, profit: 0 };
      map[key].profit += e.amount;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filteredTransactions, filteredProfitEntries, filterActive, appliedStart, appliedEnd]);





  // ── Recent transactions ─────────────────────────────────────────────────────
  const recentTransactions = useMemo(
    () => {
      const sorted = [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date));
      return filterActive ? sorted : sorted.slice(0, 5);
    },
    [filteredTransactions, filterActive]
  );

  // ── Profit entries ───────────────────────────────────────────────────────────
  const recentProfitEntries = useMemo(
    () => {
      const sorted = [...filteredProfitEntries].sort((a, b) => b.date.localeCompare(a.date));
      return filterActive ? sorted : sorted.slice(0, 5);
    },
    [filteredProfitEntries, filterActive]
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} currentPage="overview" />
        <main className="dashboard-main">
          {isLoading ? (
            <div className="overview-loading">
              <div className="overview-spinner" />
              <p>Loading overview data…</p>
            </div>
          ) : (
            <>
              {/* ── Header + Date Range Filter ── */}
              <div className="page-header overview-header">
                <div className="header-content">
                  <h1 className="page-title">Overview</h1>
                  <p className="page-description">Holistic view of your finances — filter by date to drill down</p>
                </div>

                <div className="overview-filter-bar">
                  <div className="overview-filter-inputs">
                    <div className="overview-date-field">
                      <label htmlFor="ov-start">From</label>
                      <input
                        id="ov-start"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input-pro overview-date-input"
                      />
                    </div>
                    <div className="overview-date-field">
                      <label htmlFor="ov-end">To</label>
                      <input
                        id="ov-end"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input-pro overview-date-input"
                      />
                    </div>
                  </div>
                  <button className="btn-primary overview-apply-btn" onClick={handleApplyFilter}>
                    <Filter size={16} />
                    Apply Filter
                  </button>
                  {filterActive && (
                    <button className="btn-secondary overview-clear-btn" onClick={handleClearFilter}>
                      <X size={16} />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Active filter badge */}
              {filterActive && (
                <div className="overview-filter-badge">
                  <CalendarRange size={14} />
                  <span>
                    Showing data from{" "}
                    <strong>{appliedStart || "the beginning"}</strong> to{" "}
                    <strong>{appliedEnd || "today"}</strong>
                  </span>
                </div>
              )}

              {/* ── KPI Cards ── */}
              <div className="stats-container overview-kpi-grid">
                {/* Total Expenses */}
                <div className="stat-card-pro debit-card">
                  <div className="stat-header">
                    <div className="stat-icon-wrapper debit">
                      <TrendingDown size={22} />
                    </div>
                    <span className="stat-trend negative">
                      <ArrowDownRight size={14} /> Expenses
                    </span>
                  </div>
                  <div className="stat-body">
                    <p className="stat-label">Total Expenses</p>
                    <h2 className="stat-amount">₹{totalExpenses.toLocaleString()}</h2>
                    <p className="stat-detail">{filteredTransactions.filter((t) => t.type === "expense").length} transactions</p>
                  </div>
                </div>

                {/* Business Profit */}
                <div className="stat-card-pro balance-card">
                  <div className="stat-header">
                    <div className="stat-icon-wrapper balance">
                      <DollarSign size={22} />
                    </div>
                    <span className="stat-trend positive">
                      <ArrowUpRight size={14} /> Profit
                    </span>
                  </div>
                  <div className="stat-body">
                    <p className="stat-label">Business Profit</p>
                    <h2 className="stat-amount">₹{totalProfit.toLocaleString()}</h2>
                    <p className="stat-detail">{filteredProfitEntries.length} profit entries</p>
                  </div>
                </div>
              </div>

              {/* ── Monthly Bar Chart: Transactions vs Profit ── */}
              <div className="stat-card-pro overview-chart-card">
                <div className="overview-chart-header">
                  <div>
                    <h2 className="section-title">Total Profit vs Total Transactions</h2>
                    <p className="stat-detail">Cumulative financial performance trend</p>
                  </div>
                  <div className="overview-legend-pills">
                    <span className="legend-pill blue">● Total Profit</span>
                    <span className="legend-pill dark">● Total Transactions</span>
                  </div>
                </div>
                {dailyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={dailyChartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.08)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: "rgba(26,26,26,0.6)", fontSize: 10 }} 
                        axisLine={false} 
                        tickLine={false} 
                        interval="preserveStartEnd"
                        minTickGap={30}
                        tickFormatter={(v) => {
                          const parts = v.split("-");
                          return `${parts[2]}/${parts[1]}`;
                        }}
                      />
                      <YAxis tick={{ fill: "rgba(26,26,26,0.6)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatINR} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.12)", borderRadius: 8 }}
                        formatter={(v: number | undefined) => [`₹${(v ?? 0).toLocaleString()}`, ""]}
                        labelFormatter={(l) => `Date: ${l}`}
                      />
                      <Bar dataKey="profit" name="Total Profit" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="transactions" name="Total Transactions" fill="#1a1a1a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="overview-empty">No data for selected range</div>
                )}
              </div>



              {/* ── Recent lists side by side ── */}
              <div className="overview-bottom-grid">
                {/* Recent Transactions */}
                <div className="stat-card-pro overview-mini-table">
                  <div className="table-header">
                    <h2 className="section-title">Recent Transactions</h2>
                    <span className="stat-badge live-badge">LIVE FEED</span>
                  </div>
                  <div className="table-wrapper">
                    {recentTransactions.length === 0 ? (
                      <p className="overview-empty">No transactions</p>
                    ) : (
                      <table className="table-pro">
                        <thead>
                          <tr>
                            <th>Details</th>
                            <th>Category</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTransactions.map((t) => (
                            <tr key={t._id} className="table-row-animated">
                              <td className="transaction-details">{t.details}</td>
                              <td>
                                <span className="category-badge">
                                  {t.category.charAt(0).toUpperCase() + t.category.slice(1)}
                                </span>
                              </td>
                              <td className={`amount-cell ${t.type === "income" ? "credit" : "debit"}`} style={{ textAlign: "right" }}>
                                {t.type === "expense" ? "" : "+"}₹{t.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Profit Entries */}
                <div className="stat-card-pro overview-mini-table">
                  <div className="table-header">
                    <h2 className="section-title">Profit Entries</h2>
                    <span className="stat-badge validated-badge">VALIDATED</span>
                  </div>
                  <div className="table-wrapper">
                    {recentProfitEntries.length === 0 ? (
                      <p className="overview-empty">No profit entries</p>
                    ) : (
                      <table className="table-pro">
                        <thead>
                          <tr>
                            <th>Details</th>
                            <th>Category</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentProfitEntries.map((e) => (
                            <tr key={e._id} className="table-row-animated">
                              <td className="transaction-details">{e.details || "—"}</td>
                              <td>
                                <span className="category-badge">
                                  {e.category.charAt(0).toUpperCase() + e.category.slice(1)}
                                </span>
                              </td>
                              <td className="amount-cell credit" style={{ textAlign: "right" }}>
                                +₹{e.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Overview;
