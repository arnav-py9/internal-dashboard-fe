import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Plus, TrendingDown, TrendingUp, Wallet, Calendar, X, Search, Edit2, Trash2 } from "lucide-react";
import "../styles/Dashboard.css";

async function fetchMonthlyExp(): Promise<number> {
  const userId = localStorage.getItem("user_id");
  if (!userId) return 1000;

  const res = await fetch("http://localhost:8000/api/users-finances", {
    headers: { "user-id": userId }
  });

  const data = await res.json();
  return data.user_monthly_expenditure ?? 1000;
}

async function saveMonthlyExp(value: number): Promise<number> {
  const userId = localStorage.getItem("user_id");
  if (!userId) return value;

  const res = await fetch("http://127.0.0.1:8000/api/users-finances/", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "user-id": userId
    },
    body: JSON.stringify({ user_monthly_expenditure: value })
  });

  const data = await res.json();
  return data.user_monthly_expenditure;
}

interface Transaction {
  id: string;
  details: string;
  type: "Credit" | "Debit";
  date: string;
  amount: number;
  category?: string;
}

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [];
  });
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [monthlyExp, setMonthlyExp] = useState<number>(1000);
  const [filterType, setFilterType] = useState("All");
  const [searchDetails, setSearchDetails] = useState("");
  const [filterMonth, setFilterMonth] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTransaction, setNewTransaction] = useState({
    details: "",
    type: "Debit" as "Credit" | "Debit",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    category: "Other"
  });

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    fetchMonthlyExp().then(setMonthlyExp);
  }, []);


  // Get profit from localStorage
  const getProfit = () => {
    const profit = localStorage.getItem("businessProfit");
    return profit ? parseFloat(profit) : 0;
  };

  // Calculate totals
  const totalCredit = transactions
    .filter((t) => t.type === "Credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = transactions
    .filter((t) => t.type === "Debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const businessProfit = getProfit();
  const totalBalance = totalCredit + businessProfit - totalDebit;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // FIXED: Calculate expiry correctly - balance divided by monthly spend
  const monthsLeft = monthlyExp > 0 && totalBalance > 0
    ? Math.floor(totalBalance / monthlyExp)
    : 0;

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + monthsLeft);

  // Filter transactions
  const filtered = transactions.filter((t) => {
    const matchesType = filterType === "All" || t.type === filterType;
    const matchesSearch = t.details.toLowerCase().includes(searchDetails.toLowerCase());
    const transactionMonth = new Date(t.date).getMonth();
    const matchesMonth = filterMonth === "All" || months[transactionMonth] === filterMonth;
    return matchesType && matchesSearch && matchesMonth;
  });

  // Show notification
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddTransaction = () => {
    if (newTransaction.details.trim() && newTransaction.amount > 0) {
      if (editingId) {
        setTransactions(transactions.map(t =>
          t.id === editingId ? { ...newTransaction, id: editingId } : t
        ));
        showNotification("Transaction updated successfully!");
        setEditingId(null);
      } else {
        const transaction = {
          ...newTransaction,
          id: Date.now().toString()
        };
        setTransactions([transaction, ...transactions]);
        showNotification(`${newTransaction.type} of ₹${newTransaction.amount.toLocaleString()} added!`);
      }

      setNewTransaction({
        details: "",
        type: "Debit",
        date: new Date().toISOString().split("T")[0],
        amount: 0,
        category: "Other"
      });
      setShowModal(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setNewTransaction({
      ...transaction,
      category: transaction.category || "Other"
    });
    setEditingId(transaction.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      setTransactions(transactions.filter(t => t.id !== id));
      showNotification("Transaction deleted successfully!");
    }
  };

  const categories = ["Salary", "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];

  return (
    <div className="dashboard">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} currentPage="transactions" />
        <main className="dashboard-main">
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">Transaction Overview</h1>
              <p className="page-description">Track and manage your financial transactions</p>
            </div>
            <button className="btn-primary" onClick={() => {
              setEditingId(null);
              setShowModal(true);
            }}>
              <Plus size={20} />
              <span>New Transaction</span>
            </button>
          </div>

          <div className="stats-container">
            <div className="stat-card-pro debit-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper debit">
                  <TrendingDown size={24} />
                </div>
                <span className="stat-trend negative">-{totalDebit > 0 ? '12%' : '0%'}</span>
              </div>
              <div className="stat-body">
                <p className="stat-label">Total Expenses</p>
                <h2 className="stat-amount">₹{totalDebit.toLocaleString()}</h2>
                <p className="stat-detail">This month's spending</p>
              </div>
            </div>

            <div className="stat-card-pro balance-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper balance">
                  <Wallet size={24} />
                </div>
                <span className={`stat-trend ${totalBalance > 0 ? 'positive' : 'neutral'}`}>
                  {totalBalance > 0 ? '+' : ''}₹{Math.abs(totalBalance - totalDebit).toLocaleString()}
                </span>
              </div>
              <div className="stat-body">
                <p className="stat-label">Available Balance</p>
                <h2 className="stat-amount">₹{totalBalance.toLocaleString()}</h2>
                <p className="stat-detail">Credits + Profit - Expenses</p>
              </div>
            </div>

            <div className="stat-card-pro income-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper income">
                  <TrendingUp size={24} />
                </div>
                <div className="monthly-exp-input">
                  <input
                    type="number"
                    value={monthlyExp}
                    className="exp-input"

                    onChange={(e) => {
                      setMonthlyExp(Number(e.target.value));
                    }}

                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const updated = await saveMonthlyExp(monthlyExp);
                        setMonthlyExp(updated);
                      }
                    }}
                  />

                  <span className="exp-label">per month</span>
                </div>
              </div>
              <div className="stat-body">
                <p className="stat-label">Monthly Spend</p>
                <div className="budget-bar">
                  <div
                    className="budget-fill"
                    style={{ width: `${Math.min((totalDebit / monthlyExp) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="stat-detail">{Math.round((totalDebit / monthlyExp) * 100)}% utilized</p>
              </div>
            </div>

            <div className="stat-card-pro expiry-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper expiry">
                  <Calendar size={24} />
                </div>
                <span className="stat-badge">{monthsLeft} months</span>
              </div>
              <div className="stat-body">
                <p className="stat-label">Estimated Runway</p>
                <h2 className="stat-amount">
                  {monthsLeft > 0
                    ? `${months[expiryDate.getMonth()].slice(0, 3)} '${expiryDate.getFullYear().toString().slice(-2)}`
                    : 'N/A'}
                </h2>
                <p className="stat-detail">Based on current spending</p>
              </div>
            </div>
          </div>

          <div className="table-section">
            <div className="table-header">
              <h2 className="section-title">Recent Transactions</h2>
              <div className="table-actions">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchDetails}
                    onChange={(e) => setSearchDetails(e.target.value)}
                  />
                </div>
                <select
                  className="select-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option>All</option>
                  <option>Credit</option>
                  <option>Debit</option>
                </select>
                <select
                  className="select-filter"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                >
                  <option>All Months</option>
                  {months.map((month) => (
                    <option key={month}>{month}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              {filtered.length === 0 ? (
                <div className="empty-state-pro">
                  <div className="empty-icon">
                    <Wallet size={48} />
                  </div>
                  <h3>No transactions found</h3>
                  <p>Start tracking your finances by adding your first transaction</p>
                  <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add Transaction
                  </button>
                </div>
              ) : (
                <table className="table-pro">
                  <thead>
                    <tr>
                      <th>Details</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr key={t.id} className="table-row-animated">
                        <td className="transaction-details">{t.details}</td>
                        <td>
                          <span className="category-badge">{t.category || 'Other'}</span>
                        </td>
                        <td>
                          <span className={`badge-pro ${t.type.toLowerCase()}`}>
                            {t.type === "Credit" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {t.type}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Date(t.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className={`amount-cell ${t.type.toLowerCase()}`} style={{ textAlign: 'right' }}>
                          {t.type === "Credit" ? "+" : "-"}₹{t.amount.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="action-buttons">
                            <button
                              className="btn-icon edit"
                              onClick={() => handleEdit(t)}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDelete(t.id)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <div className="modal-overlay-pro" onClick={() => {
          setShowModal(false);
          setEditingId(null);
        }}>
          <div className="modal-pro" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <div>
                <h2>{editingId ? 'Edit Transaction' : 'New Transaction'}</h2>
                <p>Fill in the transaction details below</p>
              </div>
              <button className="modal-close-pro" onClick={() => {
                setShowModal(false);
                setEditingId(null);
              }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-pro">
              <div className="form-row">
                <div className="form-field">
                  <label>Transaction Details</label>
                  <input
                    type="text"
                    placeholder="e.g., Grocery shopping"
                    value={newTransaction.details}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, details: e.target.value })
                    }
                    className="input-pro"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Category</label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, category: e.target.value })
                    }
                    className="input-pro"
                  >
                    {categories.map(cat => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Type</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        type: e.target.value as "Credit" | "Debit",
                      })
                    }
                    className="input-pro"
                  >
                    <option>Credit</option>
                    <option>Debit</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, date: e.target.value })
                    }
                    className="input-pro"
                  />
                </div>
                <div className="form-field">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newTransaction.amount || ""}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })
                    }
                    className="input-pro"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleAddTransaction}>
                  {editingId ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="toast-notification">
          <div className="toast-content">
            <div className="toast-icon">✓</div>
            <span>{notification}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;