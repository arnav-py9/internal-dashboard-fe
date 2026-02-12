import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ConfirmModal from "../components/ConfirmModal";
import { Plus, TrendingDown, TrendingUp, Wallet, Calendar, X, Search, Edit2, Trash2 } from "lucide-react";
import "../styles/Dashboard.css";

async function fetchMonthlyExp(): Promise<number> {
  const userId = localStorage.getItem("user_id");
  if (!userId) return 1000;

  const res = await fetch("/api/users-finances/", {
    headers: { "user-id": userId }
  });

  const data = await res.json();
  return data.user_monthly_expenditure ?? 1000;
}

async function saveMonthlyExp(value: number): Promise<number> {
  const userId = localStorage.getItem("user_id");
  if (!userId) return value;

  const res = await fetch("/api/users-finances/", {
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

// Transaction API functions
async function fetchTransactions(): Promise<Transaction[]> {
  const userId = localStorage.getItem("user_id");
  if (!userId) return [];

  try {
    const res = await fetch("/api/users-transactions/", {
      headers: { "user-id": userId }
    });

    if (!res.ok) throw new Error("Failed to fetch transactions");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

async function createTransaction(transaction: {
  type: "income" | "expense";
  amount: number;
  date: string;
  category: string;
  details: string;
  payee?: string;
}): Promise<Transaction | null> {
  const userId = localStorage.getItem("user_id");
  if (!userId) return null;

  try {
    const res = await fetch("/api/users-transactions/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-id": userId,
        "accept": "application/json"
      },
      body: JSON.stringify(transaction)
    });

    if (!res.ok) throw new Error("Failed to create transaction");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error creating transaction:", error);
    return null;
  }
}

async function updateTransaction(id: string, transaction: {
  type: "income" | "expense";
  amount: number;
  date: string;
  category: string;
  details: string;
  payee?: string;
}): Promise<Transaction | null> {
  const userId = localStorage.getItem("user_id");
  if (!userId) return null;

  try {
    const res = await fetch(`/api/users-transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "user-id": userId,
        "accept": "application/json"
      },
      body: JSON.stringify(transaction)
    });

    if (!res.ok) throw new Error("Failed to update transaction");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error updating transaction:", error);
    return null;
  }
}

async function deleteTransaction(id: string): Promise<boolean> {
  const userId = localStorage.getItem("user_id");
  if (!userId) return false;

  try {
    const res = await fetch(`/api/users-transactions/${id}`, {
      method: "DELETE",
      headers: {
        "user-id": userId
      }
    });

    return res.ok;
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return false;
  }
}


interface Transaction {
  _id: string;
  user_id: string;
  details: string;
  type: "income" | "expense";
  date: string;
  amount: number;
  category: string;
  payee?: string;
  created_at?: string;
  updated_at?: string;
}

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [monthlyExp, setMonthlyExp] = useState<number>(1000);
  const [searchDetails, setSearchDetails] = useState("");
  const [filterMonth, setFilterMonth] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(1000);

  const [newTransaction, setNewTransaction] = useState({
    details: "",
    type: "Debit" as "Credit" | "Debit",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    category: "Software Subscription",
    payee: ""
  });

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Fetch transactions from API on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [txns, monthlyExpValue] = await Promise.all([
        fetchTransactions(),
        fetchMonthlyExp()
      ]);
      setTransactions(txns);
      setMonthlyExp(monthlyExpValue);
      setIsLoading(false);
    };
    loadData();
  }, []);



  // Fetch business profit from backend
  const [businessProfit, setBusinessProfit] = useState(0);

  useEffect(() => {
    const fetchBusinessProfit = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setBusinessProfit(0);
        return;
      }

      try {
        const res = await fetch("/api/users-business-profit/", {
          headers: { "user-id": userId }
        });

        if (!res.ok) throw new Error("Failed to fetch business profit");

        const data = await res.json();
        // Use total_profit from backend or sum entries if needed
        const total = data.total_profit !== undefined ? data.total_profit : 0;
        setBusinessProfit(total);
      } catch (error) {
        console.error("Error fetching business profit:", error);
        setBusinessProfit(0);
      }
    };

    fetchBusinessProfit();
  }, []);

  // Calculate totals (convert backend types to frontend display)
  const totalCredit = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const now = new Date();
  const currentMonthDebit = transactions
    .filter((t) => {
      if (t.type !== "expense") return false;
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const businessPaidDebit = transactions
    .filter((t) => t.type === "expense" && t.payee === "Business")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalCredit + businessProfit - businessPaidDebit;

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
    const matchesSearch = t.details.toLowerCase().includes(searchDetails.toLowerCase());
    const transactionMonth = new Date(t.date).getMonth();
    const matchesMonth = filterMonth === "All" || filterMonth === "All Months" || months[transactionMonth] === filterMonth;
    return matchesSearch && matchesMonth;
  });

  // Show notification
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddTransaction = async () => {
    if (newTransaction.details.trim() && newTransaction.amount > 0) {
      setIsSaving(true);
      // Convert UI type (Credit/Debit) to API type (income/expense)
      const apiType = newTransaction.type === "Credit" ? "income" : "expense";

      const transactionData = {
        type: apiType as "income" | "expense",
        amount: newTransaction.amount,
        date: newTransaction.date,
        category: newTransaction.category.toLowerCase(),
        details: newTransaction.details,
        payee: newTransaction.payee || undefined
      };

      try {
        if (editingId) {
          const updated = await updateTransaction(editingId, transactionData);
          if (updated) {
            const updatedTransactions = await fetchTransactions();
            setTransactions(updatedTransactions);
            showNotification("Transaction updated successfully!");
            setEditingId(null);
          } else {
            showNotification("Failed to update transaction");
            return;
          }
        } else {
          const created = await createTransaction(transactionData);
          if (created) {
            const updatedTransactions = await fetchTransactions();
            setTransactions(updatedTransactions);
            showNotification(`${newTransaction.type} of ₹${newTransaction.amount.toLocaleString()} added!`);
          } else {
            showNotification("Failed to add transaction");
            return;
          }
        }

        setNewTransaction({
          details: "",
          type: "Debit",
          date: new Date().toISOString().split("T")[0],
          amount: 0,
          category: "Software Subscription",
          payee: ""
        });
        setShowModal(false);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleEdit = (transaction: Transaction) => {
    // Convert API type to UI type
    const displayType = transaction.type === "income" ? "Credit" : "Debit";
    setNewTransaction({
      details: transaction.details,
      type: displayType,
      date: transaction.date,
      amount: transaction.amount,
      category: transaction.category.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      payee: transaction.payee || ""
    });
    setEditingId(transaction._id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      const success = await deleteTransaction(deleteId);
      if (success) {
        const updatedTransactions = await fetchTransactions();
        setTransactions(updatedTransactions);
        showNotification("Transaction deleted successfully!");
      } else {
        showNotification("Failed to delete transaction");
      }
      setDeleteId(null);
    }
  };

  const handleOpenBudgetModal = () => {
    setBudgetInput(monthlyExp);
    setShowBudgetModal(true);
  };

  const handleSaveBudget = async () => {
    if (budgetInput > 0) {
      const updated = await saveMonthlyExp(budgetInput);
      setMonthlyExp(updated);
      setShowBudgetModal(false);
      showNotification("Monthly budget updated successfully!");
    }
  };

  const categories = ["Software Subscription", "Employee Cost", "Email Infra", "Cloud Infra", "Coaching", "Others"];

  return (
    <div className="dashboard">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} currentPage="transactions" />
        <main className="dashboard-main">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <p>Loading transactions...</p>
            </div>
          ) : (
            <>
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
                    <p className="stat-detail">Total Transactions Value</p>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '1.2rem', color: 'white', fontWeight: '600' }}>₹{monthlyExp.toLocaleString()}</span>
                        <span style={{ fontSize: '0.875rem', color: 'white', opacity: 0.7 }}>/mo</span>
                      </div>
                      <button
                        className="btn-icon edit"
                        onClick={handleOpenBudgetModal}
                        title="Edit monthly budget"
                        style={{ padding: '6px' }}
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="stat-body">
                    <p className="stat-label">Monthly Spend</p>
                    <div className="budget-bar">
                      <div
                        className="budget-fill"
                        style={{ width: `${Math.min((currentMonthDebit / monthlyExp) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="stat-detail">{Math.round((currentMonthDebit / monthlyExp) * 100)}% utilized</p>
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
                          <th>Payee</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((t) => {
                          const displayType = t.type === "income" ? "Credit" : "Debit";
                          return (
                            <tr key={t._id} className="table-row-animated">
                              <td className="transaction-details">{t.details}</td>
                              <td>
                                <span className="category-badge">{t.category.charAt(0).toUpperCase() + t.category.slice(1)}</span>
                              </td>
                              <td>
                                {t.payee ? (
                                  <span className="category-badge">{t.payee}</span>
                                ) : (
                                  <span style={{ color: '#888', fontSize: '0.875rem' }}>-</span>
                                )}
                              </td>
                              <td className="date-cell">
                                {new Date(t.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className={`amount-cell ${displayType.toLowerCase()}`} style={{ textAlign: 'right' }}>
                                ₹{t.amount.toLocaleString()}
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
                                    onClick={() => handleDelete(t._id)}
                                    title="Delete"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
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
                  <label>Payee</label>
                  <select
                    value={newTransaction.payee}
                    onChange={(e) =>
                      setNewTransaction({ ...newTransaction, payee: e.target.value })
                    }
                    className="input-pro"
                  >
                    <option value="">Select Payee</option>
                    <option value="Utkarsh">Utkarsh</option>
                    <option value="Umang">Umang</option>
                    <option value="Business">Business</option>
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
                <button
                  className="btn-primary"
                  onClick={handleAddTransaction}
                  disabled={isSaving || !newTransaction.details.trim() || newTransaction.amount <= 0 || !newTransaction.date}
                  style={{
                    opacity: (isSaving || !newTransaction.details.trim() || newTransaction.amount <= 0 || !newTransaction.date) ? 0.5 : 1,
                    cursor: (isSaving || !newTransaction.details.trim() || newTransaction.amount <= 0 || !newTransaction.date) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSaving ? 'Saving...' : `${editingId ? 'Update' : 'Add'} Transaction`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div className="modal-overlay-pro" onClick={() => setShowBudgetModal(false)}>
          <div className="modal-pro" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header-pro">
              <div>
                <h2>Edit Monthly Budget</h2>
                <p>Set your monthly spending limit</p>
              </div>
              <button className="modal-close-pro" onClick={() => setShowBudgetModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-pro">
              <div className="form-field">
                <label>Monthly Budget (₹)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={budgetInput || ""}
                  onChange={(e) => setBudgetInput(Number(e.target.value))}
                  className="input-pro"
                  autoFocus
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowBudgetModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSaveBudget}
                  disabled={!budgetInput || budgetInput <= 0}
                  style={{
                    opacity: (!budgetInput || budgetInput <= 0) ? 0.5 : 1,
                    cursor: (!budgetInput || budgetInput <= 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Save Budget
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

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirmModal(false);
          setDeleteId(null);
        }}
        type="danger"
      />
    </div>
  );
};

export default Dashboard;