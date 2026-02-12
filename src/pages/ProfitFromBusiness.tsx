import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ConfirmModal from "../components/ConfirmModal";
import { Plus, TrendingUp, X, Edit2, Trash2, DollarSign, Wallet } from "lucide-react";
import "../styles/Dashboard.css";

async function fetchBusinessProfit() {
  const userId = localStorage.getItem("user_id");

  const res = await fetch(
    "/api/users-business-profit/",
    { headers: { "user-id": userId || "" } }
  );

  return await res.json();
}

async function fetchTransactions() {
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

async function addBusinessProfit(data: {
  amount: number;
  date: string;
  details?: string;
  category?: string;
}) {
  const userId = localStorage.getItem("user_id");

  await fetch("/api/users-business-profit/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": userId || ""
    },
    body: JSON.stringify(data)
  });
}

async function updateBusinessProfit(id: string, data: {
  amount: number;
  date: string;
  details?: string;
  category?: string;
}) {
  const userId = localStorage.getItem("user_id");

  await fetch(`/api/users-business-profit/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "user-id": userId || ""
    },
    body: JSON.stringify(data)
  });
}

async function deleteBusinessProfit(id: string) {
  const userId = localStorage.getItem("user_id");

  await fetch(`/api/users-business-profit/${id}`, {
    method: "DELETE",
    headers: {
      "user-id": userId || ""
    }
  });
}

interface ProfitTransaction {
  id: string;
  details: string;
  date: string;
  amount: number;
  category?: string;
}

interface GeneralTransaction {
  _id: string;
  user_id: string;
  details: string;
  type: "income" | "expense";
  date: string;
  amount: number;
  category: string;
  payee?: string;
}

const ProfitFromBusiness: React.FC = () => {
  const [transactions, setTransactions] = useState<ProfitTransaction[]>([]);
  const [generalTransactions, setGeneralTransactions] = useState<GeneralTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [newTransaction, setNewTransaction] = useState({
    details: "",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    category: "Content-FB"
  });

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Calculate total profit
  const totalProfit = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate total amount funded (expenses where payee is not Utkarsh or Umang)
  const totalAmountFunded = generalTransactions
    .filter(t =>
      t.type === "expense" &&
      t.payee &&
      t.payee.toLowerCase() !== "utkarsh" &&
      t.payee.toLowerCase() !== "umang"
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Fetch profit data and general transactions from backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profitData, generalTxns] = await Promise.all([
          fetchBusinessProfit(),
          fetchTransactions()
        ]);

        const entries = Array.isArray(profitData.entries) ? profitData.entries : [];
        // Map _id from backend to id for frontend
        const mappedEntries = entries.map((e: any) => ({
          ...e,
          id: e._id || e.id
        }));
        setTransactions(mappedEntries);
        setGeneralTransactions(generalTxns);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Show notification
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddTransaction = async () => {
    if (newTransaction.details.trim() && newTransaction.amount > 0) {
      try {
        if (editingId) {
          await updateBusinessProfit(editingId, newTransaction);
          setTransactions(transactions.map(t =>
            t.id === editingId ? { ...newTransaction, id: editingId } : t
          ));
          showNotification("Profit entry updated successfully!");
          setEditingId(null);
        } else {
          await addBusinessProfit(newTransaction);
          const data = await fetchBusinessProfit();
          const entries = Array.isArray(data.entries) ? data.entries : [];
          const mappedEntries = entries.map((e: any) => ({
            ...e,
            id: e._id || e.id
          }));
          setTransactions(mappedEntries);
          showNotification(`Profit of ₹${newTransaction.amount.toLocaleString()} added!`);
        }

        setNewTransaction({
          details: "",
          date: new Date().toISOString().split("T")[0],
          amount: 0,
          category: "Content-FB"
        });
        setShowModal(false);
      } catch (error) {
        console.error("Error saving profit entry:", error);
        showNotification("Error saving profit entry. Please try again.");
      }
    }
  };

  const handleEdit = (transaction: ProfitTransaction) => {
    setNewTransaction({
      ...transaction,
      category: transaction.category || 'Content-FB'
    });
    setEditingId(transaction.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteBusinessProfit(deleteId);
        setTransactions(transactions.filter(t => t.id !== deleteId));
        showNotification("Profit entry deleted successfully!");
      } catch (error) {
        console.error("Error deleting profit entry:", error);
        showNotification("Error deleting profit entry. Please try again.");
      }
      setDeleteId(null);
    }
  };

  const categories = ["Content-FB", "Content-Known", "Software-Known", "Content-Cold"];

  // Calculate stats
  const thisMonthProfit = transactions
    .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const avgProfit = transactions.length > 0 ? totalProfit / transactions.length : 0;

  return (
    <div className="dashboard">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} currentPage="profit" />
        <main className="dashboard-main">
          {/* Page Header */}
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">Business Profit</h1>
              <p className="page-description">Track income from your business ventures</p>
            </div>
            <button className="btn-primary" onClick={() => {
              setEditingId(null);
              setShowModal(true);
            }}>
              <Plus size={20} />
              <span>Add Profit Entry</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-container">
            <div className="stat-card-pro balance-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper balance">
                  <DollarSign size={28} />
                </div>
                <span className="stat-trend positive">
                  +₹{thisMonthProfit.toLocaleString()}
                </span>
              </div>
              <div className="stat-body">
                <p className="stat-label">Total Business Profit</p>
                <h2 className="stat-amount">₹{totalProfit.toLocaleString()}</h2>
                <p className="stat-detail">Automatically added to your balance</p>
              </div>
            </div>

            <div className="stat-card-pro income-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper income">
                  <TrendingUp size={24} />
                </div>
                <span className="stat-badge">{transactions.length} entries</span>
              </div>
              <div className="stat-body">
                <p className="stat-label">This Month</p>
                <h2 className="stat-amount">₹{thisMonthProfit.toLocaleString()}</h2>
                <p className="stat-detail">Current month earnings</p>
              </div>
            </div>

            <div className="stat-card-pro expiry-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper expiry">
                  <TrendingUp size={24} />
                </div>
                <span className="stat-trend neutral">avg</span>
              </div>
              <div className="stat-body">
                <p className="stat-label">Average Per Entry</p>
                <h2 className="stat-amount">₹{Math.round(avgProfit).toLocaleString()}</h2>
                <p className="stat-detail">Mean profit value</p>
              </div>
            </div>

            <div className="stat-card-pro debit-card">
              <div className="stat-header">
                <div className="stat-icon-wrapper debit">
                  <Wallet size={24} />
                </div>
                <span className="stat-badge">Business expenses</span>
              </div>
              <div className="stat-body">
                <p className="stat-label">Total Amount Funded</p>
                <h2 className="stat-amount">₹{totalAmountFunded.toLocaleString()}</h2>
                <p className="stat-detail">Transactions funded by Business</p>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="table-section">
            <div className="table-header">
              <h2 className="section-title">Profit Entries</h2>
              <span className="stat-badge">{transactions.length} total entries</span>
            </div>

            <div className="table-wrapper">
              {loading ? (
                <div className="empty-state-pro">
                  <div className="empty-icon">
                    <TrendingUp size={48} />
                  </div>
                  <h3>Loading profit entries...</h3>
                  <p>Please wait while we fetch your data</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state-pro">
                  <div className="empty-icon">
                    <TrendingUp size={48} />
                  </div>
                  <h3>No profit entries yet</h3>
                  <p>Start tracking your business income by adding your first profit entry</p>
                  <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    Add First Entry
                  </button>
                </div>
              ) : (
                <table className="table-pro">
                  <thead>
                    <tr>
                      <th>Details</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="table-row-animated">
                        <td className="transaction-details">{t.details}</td>
                        <td>
                          <span className="category-badge">{t.category || 'Other'}</span>
                        </td>
                        <td className="date-cell">
                          {new Date(t.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="text-right amount-cell credit">
                          +₹{t.amount.toLocaleString()}
                        </td>
                        <td className="text-center">
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

      {/* Enhanced Modal */}
      {showModal && (
        <div className="modal-overlay-pro" onClick={() => {
          setShowModal(false);
          setEditingId(null);
        }}>
          <div className="modal-pro" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <div>
                <h2>{editingId ? 'Edit Profit Entry' : 'New Profit Entry'}</h2>
                <p>Fill in the business profit details below</p>
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
                  <label>Profit Details</label>
                  <input
                    type="text"
                    placeholder="e.g., Product sales Q4"
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
              </div>

              <div className="form-row">
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
                  {editingId ? 'Update' : 'Add'} Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
        title="Delete Profit Entry"
        message="Are you sure you want to delete this profit entry? This action cannot be undone."
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

export default ProfitFromBusiness;