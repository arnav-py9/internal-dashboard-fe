import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Plus, TrendingUp, X, Edit2, Trash2, DollarSign } from "lucide-react";
import "../styles/Dashboard.css";

interface ProfitTransaction {
  id: string;
  details: string;
  date: string;
  amount: number;
  category?: string;
}

const ProfitFromBusiness: React.FC = () => {
  const [transactions, setTransactions] = useState<ProfitTransaction[]>(() => {
    const saved = localStorage.getItem("profitTransactions");
    return saved ? JSON.parse(saved) : [];
  });
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newTransaction, setNewTransaction] = useState({
    details: "",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    category: "Sales"
  });

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  // Calculate total profit
  const totalProfit = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Save to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem("profitTransactions", JSON.stringify(transactions));
    localStorage.setItem("businessProfit", totalProfit.toString());
  }, [transactions, totalProfit]);

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
        showNotification("Profit entry updated successfully!");
        setEditingId(null);
      } else {
        const transaction = {
          ...newTransaction,
          id: Date.now().toString()
        };
        setTransactions([transaction, ...transactions]);
        showNotification(`Profit of ₹${newTransaction.amount.toLocaleString()} added!`);
      }
      
      setNewTransaction({
        details: "",
        date: new Date().toISOString().split("T")[0],
        amount: 0,
        category: "Sales"
      });
      setShowModal(false);
    }
  };

  const handleEdit = (transaction: ProfitTransaction) => {
    setNewTransaction({
      ...transaction,
      category: transaction.category || 'Other'
    });
    setEditingId(transaction.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this profit entry?")) {
      setTransactions(transactions.filter(t => t.id !== id));
      showNotification("Profit entry deleted successfully!");
    }
  };

  const categories = ["Sales", "Services", "Investment", "Commission", "Other"];

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
          </div>

          {/* Transactions Table */}
          <div className="table-section">
            <div className="table-header">
              <h2 className="section-title">Profit Entries</h2>
              <span className="stat-badge">{transactions.length} total entries</span>
            </div>

            <div className="table-wrapper">
              {transactions.length === 0 ? (
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
    </div>
  );
};

export default ProfitFromBusiness;