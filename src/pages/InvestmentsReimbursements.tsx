import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ConfirmModal from "../components/ConfirmModal";
import { Plus, HandCoins, ArrowLeftRight, Banknote, TrendingUp, TrendingDown, X, Edit2, Trash2 } from "lucide-react";
import "../styles/Dashboard.css";

// -------------------- API Functions --------------------

async function fetchFoundersTransactions() {
  const userId = localStorage.getItem("user_id");
  const res = await fetch("/api/founders-transactions/", {
    headers: { "user-id": userId || "" }
  });
  return await res.json();
}

async function addFoundersTransaction(data: {
  type: string;
  amount: number;
  date: string;
  paid_by?: string;
  paid_to?: string;
  payee?: string;
}) {
  const userId = localStorage.getItem("user_id");
  await fetch("/api/founders-transactions/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "user-id": userId || ""
    },
    body: JSON.stringify(data)
  });
}

async function updateFoundersTransaction(id: string, data: {
  type: string;
  amount: number;
  date: string;
  paid_by?: string;
  paid_to?: string;
  payee?: string;
}) {
  const userId = localStorage.getItem("user_id");
  await fetch(`/api/founders-transactions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "user-id": userId || ""
    },
    body: JSON.stringify(data)
  });
}

async function deleteFoundersTransaction(id: string) {
  const userId = localStorage.getItem("user_id");
  await fetch(`/api/founders-transactions/${id}`, {
    method: "DELETE",
    headers: { "user-id": userId || "" }
  });
}

// -------------------- Types --------------------

interface FounderSummary {
  total_invested: number;
  reimbursements_received: number;
  reimbursements_made: number;
  salary_taken: number;
  exact_payment: number;
  net_contribution: number;
}

interface ReimbursementTxn {
  _id: string;
  type: "reimbursement";
  paid_by: string;
  paid_to: string;
  amount: number;
  date: string;
}

interface SalaryTxn {
  _id: string;
  type: "salary";
  payee: string;
  amount: number;
  date: string;
}

// -------------------- Component --------------------

const FOUNDERS = ["Utkarsh", "Umang"];

const InvestmentsReimbursements: React.FC = () => {
  const [foundersSummary, setFoundersSummary] = useState<Record<string, FounderSummary>>({});
  const [reimbursements, setReimbursements] = useState<ReimbursementTxn[]>([]);
  const [salaries, setSalaries] = useState<SalaryTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [newTxn, setNewTxn] = useState({
    type: "reimbursement" as "reimbursement" | "salary",
    paid_by: "Utkarsh",
    paid_to: "Umang",
    payee: "Utkarsh",
    amount: 0,
    date: new Date().toISOString().split("T")[0]
  });

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  const loadData = async () => {
    try {
      const data = await fetchFoundersTransactions();
      setFoundersSummary(data.founders_summary || {});
      setReimbursements(data.reimbursements || []);
      setSalaries(data.salaries || []);
    } catch (error) {
      console.error("Error fetching founders transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setNewTxn({
      type: "reimbursement",
      paid_by: "Utkarsh",
      paid_to: "Umang",
      payee: "Utkarsh",
      amount: 0,
      date: new Date().toISOString().split("T")[0]
    });
  };

  const handleSubmit = async () => {
    if (newTxn.amount <= 0) return;

    const payload: any = {
      type: newTxn.type,
      amount: newTxn.amount,
      date: newTxn.date
    };

    if (newTxn.type === "reimbursement") {
      payload.paid_by = newTxn.paid_by;
      payload.paid_to = newTxn.paid_to;
    } else {
      payload.payee = newTxn.payee;
    }

    try {
      if (editingId) {
        await updateFoundersTransaction(editingId, payload);
        showNotification("Transaction updated successfully!");
        setEditingId(null);
      } else {
        await addFoundersTransaction(payload);
        showNotification(`${newTxn.type === "reimbursement" ? "Reimbursement" : "Salary"} of ₹${newTxn.amount.toLocaleString()} added!`);
      }
      resetForm();
      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      showNotification("Error saving transaction. Please try again.");
    }
  };

  const handleEditReimbursement = (t: ReimbursementTxn) => {
    setNewTxn({
      type: "reimbursement",
      paid_by: t.paid_by,
      paid_to: t.paid_to,
      payee: "Utkarsh",
      amount: t.amount,
      date: t.date
    });
    setEditingId(t._id);
    setShowModal(true);
  };

  const handleEditSalary = (t: SalaryTxn) => {
    setNewTxn({
      type: "salary",
      paid_by: "Utkarsh",
      paid_to: "Umang",
      payee: t.payee,
      amount: t.amount,
      date: t.date
    });
    setEditingId(t._id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteFoundersTransaction(deleteId);
        showNotification("Transaction deleted successfully!");
        await loadData();
      } catch (error) {
        console.error("Error deleting transaction:", error);
        showNotification("Error deleting transaction. Please try again.");
      }
      setDeleteId(null);
    }
  };

  return (
    <div className="dashboard">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="dashboard-body">
        <Sidebar isOpen={isSidebarOpen} currentPage="investments" />
        <main className="dashboard-main">
          {/* Page Header */}
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">Investments & Reimbursements</h1>
              <p className="page-description">Track founder investments, reimbursements, and salary withdrawals</p>
            </div>
            <button className="btn-primary" onClick={() => {
              setEditingId(null);
              resetForm();
              setShowModal(true);
            }}>
              <Plus size={20} />
              <span>Add Transaction</span>
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {/* Founder Summary Cards */}
              {FOUNDERS.map((founder) => {
                const s = foundersSummary[founder] || { total_invested: 0, reimbursements_received: 0, reimbursements_made: 0, salary_taken: 0, exact_payment: 0, net_contribution: 0 };
                return (
                  <div key={founder} style={{ marginBottom: '2rem' }}>
                    <h2 style={{ color: '#e2e8f0', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', paddingLeft: '0.25rem' }}>
                      {founder}
                    </h2>
                    <div className="stats-container">
                      <div className="stat-card-pro debit-card">
                        <div className="stat-header">
                          <div className="stat-icon-wrapper debit">
                            <HandCoins size={24} />
                          </div>
                          <span className="stat-trend negative">invested</span>
                        </div>
                        <div className="stat-body">
                          <p className="stat-label">Total Invested</p>
                          <h2 className="stat-amount">₹{s.total_invested.toLocaleString()}</h2>
                          <p className="stat-detail">From business expenses</p>
                        </div>
                      </div>

                      <div className="stat-card-pro balance-card">
                        <div className="stat-header">
                          <div className="stat-icon-wrapper balance">
                            <ArrowLeftRight size={24} />
                          </div>
                          <span className="stat-badge">
                            +₹{s.reimbursements_received.toLocaleString()} / -₹{s.reimbursements_made.toLocaleString()}
                          </span>
                        </div>
                        <div className="stat-body">
                          <p className="stat-label">Exact Payment</p>
                          <h2 className="stat-amount">₹{s.exact_payment.toLocaleString()}</h2>
                          <p className="stat-detail">Invested - received + paid to other</p>
                        </div>
                      </div>

                      <div className="stat-card-pro income-card">
                        <div className="stat-header">
                          <div className="stat-icon-wrapper income">
                            <Banknote size={24} />
                          </div>
                          <span className="stat-trend neutral">salary</span>
                        </div>
                        <div className="stat-body">
                          <p className="stat-label">Salary Taken Out</p>
                          <h2 className="stat-amount">₹{s.salary_taken.toLocaleString()}</h2>
                          <p className="stat-detail">Withdrawn from business</p>
                        </div>
                      </div>

                      <div className="stat-card-pro expiry-card">
                        <div className="stat-header">
                          <div className="stat-icon-wrapper expiry">
                            {s.net_contribution >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                          </div>
                          <span className={`stat-trend ${s.net_contribution >= 0 ? 'positive' : 'negative'}`}>
                            {s.net_contribution >= 0 ? 'surplus' : 'deficit'}
                          </span>
                        </div>
                        <div className="stat-body">
                          <p className="stat-label">Net Contribution</p>
                          <h2 className="stat-amount">₹{Math.abs(s.net_contribution).toLocaleString()}</h2>
                          <p className="stat-detail">
                            {s.net_contribution >= 0 ? 'Taken out more than invested' : 'Invested more than taken out'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Reimbursements Table */}
              <div className="table-section">
                <div className="table-header">
                  <h2 className="section-title">Reimbursement Transactions</h2>
                  <span className="stat-badge">{reimbursements.length} entries</span>
                </div>
                <div className="table-wrapper">
                  {reimbursements.length === 0 ? (
                    <div className="empty-state-pro">
                      <div className="empty-icon">
                        <ArrowLeftRight size={48} />
                      </div>
                      <h3>No reimbursements yet</h3>
                      <p>Add internal settlement transactions between founders</p>
                    </div>
                  ) : (
                    <table className="table-pro">
                      <thead>
                        <tr>
                          <th>Paid By</th>
                          <th>Paid To</th>
                          <th>Date</th>
                          <th className="text-right">Amount</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reimbursements.map((t) => (
                          <tr key={t._id} className="table-row-animated">
                            <td><span className="category-badge">{t.paid_by}</span></td>
                            <td><span className="category-badge">{t.paid_to}</span></td>
                            <td className="date-cell">
                              {new Date(t.date).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </td>
                            <td className="text-right amount-cell credit">
                              ₹{t.amount.toLocaleString()}
                            </td>
                            <td className="text-center">
                              <div className="action-buttons">
                                <button className="btn-icon edit" onClick={() => handleEditReimbursement(t)} title="Edit">
                                  <Edit2 size={16} />
                                </button>
                                <button className="btn-icon delete" onClick={() => handleDelete(t._id)} title="Delete">
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

              {/* Salary Table */}
              <div className="table-section" style={{ marginTop: '2rem' }}>
                <div className="table-header">
                  <h2 className="section-title">Salary Transactions</h2>
                  <span className="stat-badge">{salaries.length} entries</span>
                </div>
                <div className="table-wrapper">
                  {salaries.length === 0 ? (
                    <div className="empty-state-pro">
                      <div className="empty-icon">
                        <Banknote size={48} />
                      </div>
                      <h3>No salary transactions yet</h3>
                      <p>Track salary withdrawals by founders from the business</p>
                    </div>
                  ) : (
                    <table className="table-pro">
                      <thead>
                        <tr>
                          <th>Founder</th>
                          <th>Date</th>
                          <th className="text-right">Amount</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaries.map((t) => (
                          <tr key={t._id} className="table-row-animated">
                            <td><span className="category-badge">{t.payee}</span></td>
                            <td className="date-cell">
                              {new Date(t.date).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </td>
                            <td className="text-right amount-cell debit">
                              ₹{t.amount.toLocaleString()}
                            </td>
                            <td className="text-center">
                              <div className="action-buttons">
                                <button className="btn-icon edit" onClick={() => handleEditSalary(t)} title="Edit">
                                  <Edit2 size={16} />
                                </button>
                                <button className="btn-icon delete" onClick={() => handleDelete(t._id)} title="Delete">
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
            </>
          )}
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay-pro" onClick={() => {
          setShowModal(false);
          setEditingId(null);
        }}>
          <div className="modal-pro" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <div>
                <h2>{editingId ? 'Edit Transaction' : 'New Transaction'}</h2>
                <p>Add a reimbursement or salary transaction</p>
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
                  <label>Type</label>
                  <select
                    value={newTxn.type}
                    onChange={(e) => setNewTxn({ ...newTxn, type: e.target.value as "reimbursement" | "salary" })}
                    className="input-pro"
                    disabled={!!editingId}
                  >
                    <option value="reimbursement">Reimbursement</option>
                    <option value="salary">Salary</option>
                  </select>
                </div>
              </div>

              {newTxn.type === "reimbursement" ? (
                <div className="form-row">
                  <div className="form-field">
                    <label>Paid By</label>
                    <select
                      value={newTxn.paid_by}
                      onChange={(e) => setNewTxn({ ...newTxn, paid_by: e.target.value })}
                      className="input-pro"
                    >
                      {FOUNDERS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Paid To</label>
                    <select
                      value={newTxn.paid_to}
                      onChange={(e) => setNewTxn({ ...newTxn, paid_to: e.target.value })}
                      className="input-pro"
                    >
                      {FOUNDERS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-field">
                    <label>Founder</label>
                    <select
                      value={newTxn.payee}
                      onChange={(e) => setNewTxn({ ...newTxn, payee: e.target.value })}
                      className="input-pro"
                    >
                      {FOUNDERS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-field">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newTxn.date}
                    onChange={(e) => setNewTxn({ ...newTxn, date: e.target.value })}
                    className="input-pro"
                  />
                </div>
                <div className="form-field">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newTxn.amount || ""}
                    onChange={(e) => setNewTxn({ ...newTxn, amount: Number(e.target.value) })}
                    className="input-pro"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={newTxn.amount <= 0}
                  style={{
                    opacity: newTxn.amount <= 0 ? 0.5 : 1,
                    cursor: newTxn.amount <= 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {editingId ? 'Update' : 'Add'} Transaction
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

export default InvestmentsReimbursements;
