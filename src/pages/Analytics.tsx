import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { BarChart3, TrendingUp, Activity } from "lucide-react";
import "../styles/Dashboard.css";

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

const Analytics: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [businessProfitData, setBusinessProfitData] = useState<BusinessProfitResponse>({
    total_profit: 0,
    entries: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch transactions
        const txnRes = await fetch("/api/users-transactions/", {
          headers: { "user-id": userId }
        });
        if (txnRes.ok) {
          const txnData = await txnRes.json();
          setTransactions(txnData);
        }

        // Fetch business profit data
        const profitRes = await fetch("/api/users-business-profit/", {
          headers: { "user-id": userId }
        });
        if (profitRes.ok) {
          const profitData = await profitRes.json();
          setBusinessProfitData(profitData);
        }
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Process transaction categories data for pie chart
  const getTransactionCategoriesData = () => {
    const categoryMap = new Map<string, number>();

    transactions.forEach((transaction) => {
      const category = transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1);
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + transaction.amount);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Process business profit by category for pie chart
  const getBusinessProfitByCategory = () => {
    const categoryMap = new Map<string, number>();

    businessProfitData.entries.forEach((entry) => {
      const category = entry.category.charAt(0).toUpperCase() + entry.category.slice(1);
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + entry.amount);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Cumulative business profit (revenue) over time — from user business profits
  const getCumulativeBusinessProfitOverTime = () => {
    const byDate = new Map<string, number>();
    businessProfitData.entries.forEach((entry) => {
      const d = entry.date.slice(0, 10); // YYYY-MM-DD
      byDate.set(d, (byDate.get(d) ?? 0) + entry.amount);
    });
    const sorted = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));
    let cumulative = 0;
    return sorted.map(({ date, amount }) => {
      cumulative += amount;
      return { date, value: cumulative };
    });
  };

  const transactionCategoriesData = getTransactionCategoriesData();
  const businessProfitCategoriesData = getBusinessProfitByCategory();
  const cumulativeData = getCumulativeBusinessProfitOverTime();

  // Colors for pie charts
  const COLORS = [
    "#2563eb",
    "#1a1a1a",
    "#93b4f6",
    "#5e5e5e",
    "#d3e0fb",
    "#6f91e8",
    "#2f2f2f",
    "#7aa2ff",
  ];

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show labels for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="dashboard">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} currentPage="analytics" />
        <main className="dashboard-main">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <p>Loading analytics data...</p>
            </div>
          ) : (
            <>
              <div className="page-header">
                <div className="header-content">
                  <h1 className="page-title">Analytics Dashboard</h1>
                  <p className="page-description">Visualize your financial data with interactive charts</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                {/* Transaction Categories Pie Chart */}
                <div className="stat-card-pro" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div className="stat-icon-wrapper balance">
                      <BarChart3 size={24} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0, color: "#1a1a1a" }}>
                        Transaction Categories
                      </h2>
                      <p style={{ fontSize: "0.875rem", color: "rgba(26,26,26,0.72)", margin: "4px 0 0 0" }}>
                        Distribution of all transactions by category
                      </p>
                    </div>
                  </div>

                  {transactionCategoriesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={transactionCategoriesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {transactionCategoriesData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number | undefined) => value !== undefined ? `₹${value.toLocaleString()}` : '₹0'}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(26, 26, 26, 0.12)",
                            borderRadius: "8px",
                            color: "#1a1a1a"
                          }}
                          itemStyle={{ color: "#1a1a1a" }}
                          labelStyle={{ color: "#1a1a1a", fontWeight: "bold" }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => value}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{
                      height: '300px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: "#1a1a1a"
                    }}>
                      No transaction data available
                    </div>
                  )}
                </div>

                {/* Business Profit by Category Pie Chart */}
                <div className="stat-card-pro" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div className="stat-icon-wrapper income">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0, color: "#1a1a1a" }}>
                        Business Earnings by Category
                      </h2>
                      <p style={{ fontSize: "0.875rem", color: "rgba(26,26,26,0.72)", margin: "4px 0 0 0" }}>
                        Distribution of business profit across categories
                      </p>
                    </div>
                  </div>

                  {businessProfitCategoriesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={businessProfitCategoriesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {businessProfitCategoriesData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number | undefined) => value !== undefined ? `₹${value.toLocaleString()}` : '₹0'}
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid rgba(26, 26, 26, 0.12)",
                            borderRadius: "8px",
                            color: "#1a1a1a"
                          }}
                          itemStyle={{ color: "#1a1a1a" }}
                          labelStyle={{ color: "#1a1a1a", fontWeight: "bold" }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => value}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{
                      height: '300px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: "#1a1a1a"
                    }}>
                      No business profit data available
                    </div>
                  )}
                </div>
              </div>

              {/* Cumulative Revenue Over Time */}
              <div className="stat-card-pro" style={{ padding: "24px", marginTop: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div className="stat-icon-wrapper income">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0, color: "#1a1a1a" }}>
                      Cumulative Revenue Over Time
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "rgba(26,26,26,0.72)", margin: "4px 0 0 0" }}>
                      Running total of business profit (your revenue) by date
                    </p>
                  </div>
                </div>

                {cumulativeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={cumulativeData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.12)" />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(26,26,26,0.5)"
                        tick={{ fill: "rgba(26,26,26,0.75)", fontSize: 12 }}
                        tickFormatter={(v) => {
                          const [y, m, d] = v.split("-");
                          return `${d}/${m}/${y.slice(2)}`;
                        }}
                      />
                      <YAxis
                        stroke="rgba(26,26,26,0.5)"
                        tick={{ fill: "rgba(26,26,26,0.75)", fontSize: 12 }}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid rgba(26, 26, 26, 0.12)",
                          borderRadius: "8px",
                          color: "#1a1a1a"
                        }}
                        labelStyle={{ color: "#1a1a1a", fontWeight: "bold" }}
                        formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString()}`, "Cumulative value"]}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Cumulative business profit"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: "#2563eb", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    style={{
                      height: "320px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#1a1a1a"
                    }}
                  >
                    No cumulative data found. Add business profit entries to see your revenue grow over time.
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
                <div className="stat-card-pro" style={{ padding: '20px' }}>
                  <p style={{ fontSize: "0.875rem", color: "rgba(26,26,26,0.72)", margin: "0 0 8px 0" }}>Total Transactions</p>
                  <h3 style={{ fontSize: "1.875rem", fontWeight: "700", margin: 0, color: "#1a1a1a" }}>
                    {transactions.length}
                  </h3>
                </div>

                <div className="stat-card-pro" style={{ padding: '20px' }}>
                  <p style={{ fontSize: "0.875rem", color: "rgba(26,26,26,0.72)", margin: "0 0 8px 0" }}>Total Categories</p>
                  <h3 style={{ fontSize: "1.875rem", fontWeight: "700", margin: 0, color: "#1a1a1a" }}>
                    {transactionCategoriesData.length}
                  </h3>
                </div>

                <div className="stat-card-pro" style={{ padding: '20px' }}>
                  <p style={{ fontSize: "0.875rem", color: "rgba(26,26,26,0.72)", margin: "0 0 8px 0" }}>Business Profit</p>
                  <h3 style={{ fontSize: "1.875rem", fontWeight: "700", margin: 0, color: "#1a1a1a" }}>
                    ₹{businessProfitData.total_profit.toLocaleString()}
                  </h3>
                </div>

                <div className="stat-card-pro" style={{ padding: '20px' }}>
                  <p style={{ fontSize: "0.875rem", color: "rgba(26,26,26,0.72)", margin: "0 0 8px 0" }}>Profit Sources</p>
                  <h3 style={{ fontSize: "1.875rem", fontWeight: "700", margin: 0, color: "#1a1a1a" }}>
                    {businessProfitCategoriesData.length}
                  </h3>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Analytics;
