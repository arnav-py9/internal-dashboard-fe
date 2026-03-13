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

  // Cumulative revenue (income) over time — grouped by month, sorted, then cumulative sum
  const getCumulativeRevenueOverTime = () => {
    const incomeByMonth = new Map<string, number>();
    transactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        const month = t.date.slice(0, 7); // YYYY-MM
        incomeByMonth.set(month, (incomeByMonth.get(month) ?? 0) + t.amount);
      });
    const sorted = Array.from(incomeByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, revenue]) => ({ period, revenue }));
    let cumulative = 0;
    return sorted.map(({ period, revenue }) => {
      cumulative += revenue;
      return { period, revenue, cumulative };
    });
  };

  const transactionCategoriesData = getTransactionCategoriesData();
  const businessProfitCategoriesData = getBusinessProfitByCategory();
  const cumulativeRevenueData = getCumulativeRevenueOverTime();

  // Colors for pie charts
  const COLORS = [
    '#4F46E5', // Indigo
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
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
                  <h1 className="page-title" style={{ color: 'white' }}>Analytics Dashboard</h1>
                  <p className="page-description" style={{ color: 'white' }}>Visualize your financial data with interactive charts</p>
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
                      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'white' }}>
                        Transaction Categories
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'white', margin: '4px 0 0 0' }}>
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
                            backgroundColor: '#1e1e2e',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
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
                      color: 'white'
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
                      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: 'white' }}>
                        Business Earnings by Category
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'white', margin: '4px 0 0 0' }}>
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
                            backgroundColor: '#1e1e2e',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#fff', fontWeight: 'bold' }}
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
                      color: 'white'
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
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "600", margin: 0, color: "white" }}>
                      Cumulative Revenue Over Time
                    </h2>
                    <p style={{ fontSize: "0.875rem", color: "white", margin: "4px 0 0 0" }}>
                      Running total of income by month
                    </p>
                  </div>
                </div>

                {cumulativeRevenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={cumulativeRevenueData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="period"
                        stroke="rgba(255,255,255,0.6)"
                        tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 12 }}
                        tickFormatter={(v) => {
                          const [y, m] = v.split("-");
                          return `${m}/${y.slice(2)}`;
                        }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.6)"
                        tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 12 }}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e1e2e",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "8px",
                          color: "#fff"
                        }}
                        labelStyle={{ color: "#fff", fontWeight: "bold" }}
                        formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString()}`, "Cumulative"]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        name="Cumulative revenue"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: "#10B981", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
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
                      color: "white"
                    }}
                  >
                    No income data available for cumulative revenue
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px' }}>
                <div className="stat-card-pro" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'white', margin: '0 0 8px 0' }}>Total Transactions</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: '700', margin: 0, color: 'white' }}>
                    {transactions.length}
                  </h3>
                </div>

                <div className="stat-card-pro" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'white', margin: '0 0 8px 0' }}>Total Categories</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: '700', margin: 0, color: 'white' }}>
                    {transactionCategoriesData.length}
                  </h3>
                </div>

                <div className="stat-card-pro" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'white', margin: '0 0 8px 0' }}>Business Profit</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: '700', margin: 0, color: 'white' }}>
                    ₹{businessProfitData.total_profit.toLocaleString()}
                  </h3>
                </div>

                <div className="stat-card-pro" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'white', margin: '0 0 8px 0' }}>Profit Sources</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: '700', margin: 0, color: 'white' }}>
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
