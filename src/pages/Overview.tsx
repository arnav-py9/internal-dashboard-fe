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
  Legend,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
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

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
  const totalIncome = useMemo(
    () => filteredTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [filteredTransactions]
  );
  const totalProfit = useMemo(
    () => filteredProfitEntries.reduce((s, e) => s + e.amount, 0),
    [filteredProfitEntries]
  );
  const netBalance = totalIncome + totalProfit - totalExpenses;

  // ── Monthly bar-chart data (Transactions vs Profit) ──────────────────────────
  const monthlyChartData = useMemo(() => {
    const map: Record<string, { month: string; transactions: number; profit: number }> = {};

    filteredTransactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { month: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`, transactions: 0, profit: 0 };
      map[key].transactions += t.amount;
    });

    filteredProfitEntries.forEach((e) => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { month: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`, transactions: 0, profit: 0 };
      map[key].profit += e.amount;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filteredTransactions, filteredProfitEntries]);

  // ── Net cash-flow area chart ─────────────────────────────────────────────────
  const cashFlowData = useMemo(() => {
    const map: Record<string, { date: string; income: number; expense: number; net: number }> = {};

    filteredTransactions.forEach((t) => {
      const key = t.date.slice(0, 10);
      if (!map[key]) map[key] = { date: key, income: 0, expense: 0, net: 0 };
      if (t.type === "income") map[key].income += t.amount;
      else map[key].expense += t.amount;
    });

    filteredProfitEntries.forEach((e) => {
      const key = e.date.slice(0, 10);
      if (!map[key]) map[key] = { date: key, income: 0, expense: 0, net: 0 };
      map[key].income += e.amount;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, net: v.income - v.expense }));
  }, [filteredTransactions, filteredProfitEntries]);

  // ── Expense breakdown by category ────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = t.category.charAt(0).toUpperCase() + t.category.slice(1);
        map[cat] = (map[cat] ?? 0) + t.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredTransactions]);

  // ── Recent transactions (latest 5) ───────────────────────────────────────────
  const recentTransactions = useMemo(
    () => [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [filteredTransactions]
  );

  // ── Profit entries (latest 5) ─────────────────────────────────────────────────
  const recentProfitEntries = useMemo(
    () => [...filteredProfitEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [filteredProfitEntries]
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

                {/* Total Income */}
                <div className="stat-card-pro income-card">
                  <div className="stat-header">
                    <div className="stat-icon-wrapper income">
                      <TrendingUp size={22} />
                    </div>
                    <span className="stat-trend positive">
                      <ArrowUpRight size={14} /> Income
                    </span>
                  </div>
                  <div className="stat-body">
                    <p className="stat-label">Total Income</p>
                    <h2 className="stat-amount">₹{totalIncome.toLocaleString()}</h2>
                    <p className="stat-detail">{filteredTransactions.filter((t) => t.type === "income").length} transactions</p>
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

                {/* Net Balance */}
                <div className="stat-card-pro expiry-card">
                  <div className="stat-header">
                    <div className="stat-icon-wrapper expiry">
                      <Wallet size={22} />
                    </div>
                    <span className={`stat-trend ${netBalance >= 0 ? "positive" : "negative"}`}>
                      {netBalance >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      Net
                    </span>
                  </div>
                  <div className="stat-body">
                    <p className="stat-label">Net Balance</p>
                    <h2 className="stat-amount">₹{Math.abs(netBalance).toLocaleString()}</h2>
                    <p className="stat-detail">{netBalance >= 0 ? "Surplus" : "Deficit"} for the period</p>
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
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthlyChartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.08)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "rgba(26,26,26,0.6)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(26,26,26,0.6)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatINR} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.12)", borderRadius: 8 }}
                        formatter={(v: number | undefined) => [`₹${(v ?? 0).toLocaleString()}`, ""]}
                      />
                      <Bar dataKey="profit" name="Total Profit" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="transactions" name="Total Transactions" fill="#1a1a1a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="overview-empty">No data for selected range</div>
                )}
              </div>

              {/* ── Net Cash-Flow Area Chart ── */}
              <div className="stat-card-pro overview-chart-card" style={{ marginTop: 24 }}>
                <div className="overview-chart-header">
                  <div>
                    <h2 className="section-title">Daily Cash Flow</h2>
                    <p className="stat-detail">Income vs Expenses day-by-day</p>
                  </div>
                </div>
                {cashFlowData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={cashFlowData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                      <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.14} />
                          <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.08)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "rgba(26,26,26,0.6)", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => {
                          const [, m, d] = v.split("-");
                          return `${d}/${m}`;
                        }}
                      />
                      <YAxis tick={{ fill: "rgba(26,26,26,0.6)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatINR} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.12)", borderRadius: 8 }}
                        formatter={(v: number | undefined, name: string | undefined) => [`₹${(v ?? 0).toLocaleString()}`, name ?? ""]}
                        labelFormatter={(l) => `Date: ${l}`}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="income" name="Income" stroke="#2563eb" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 5 }} />
                      <Area type="monotone" dataKey="expense" name="Expense" stroke="#1a1a1a" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="overview-empty">No data for selected range</div>
                )}
              </div>

              {/* ── Expense Category Bar + Recent lists ── */}
              <div className="overview-bottom-grid">
                {/* Expense by category */}
                <div className="stat-card-pro overview-chart-card">
                  <div className="overview-chart-header">
                    <div>
                      <h2 className="section-title">Expense by Category</h2>
                      <p className="stat-detail">Top spending categories</p>
                    </div>
                  </div>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.08)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "rgba(26,26,26,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatINR} />
                        <YAxis dataKey="name" type="category" tick={{ fill: "rgba(26,26,26,0.72)", fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.12)", borderRadius: 8 }}
                          formatter={(v: number | undefined) => [`₹${(v ?? 0).toLocaleString()}`, "Amount"]}
                        />
                        <Bar dataKey="value" name="Amount" fill="#2563eb" radius={[0, 4, 4, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="overview-empty">No expense data for selected range</div>
                  )}
                </div>

                {/* Two mini-tables side by side */}
                <div className="overview-tables-stack">
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
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Overview;
