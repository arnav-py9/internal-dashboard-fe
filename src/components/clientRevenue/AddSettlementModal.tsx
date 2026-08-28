import React, { useState } from "react";
import { X } from "lucide-react";
import type { Settlement } from "../../data/clientRevenueMockData";
import type { BatchMetrics } from "../../utils/clientRevenueCalculations";
import { formatINR } from "../../utils/clientRevenueCalculations";

interface Props {
  batchId: string;
  batchName: string;
  metrics: BatchMetrics;
  onClose: () => void;
  onAdd: (settlement: Settlement) => void;
}

const FROM_ACCOUNTS = ["Business", "Personal", "Slice", "Other"] as const;
const TO_ACCOUNTS = ["Personal", "Business", "Slice", "Other"] as const;

const AddSettlementModal: React.FC<Props> = ({ batchId, batchName, metrics, onClose, onAdd }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [fromAccount, setFromAccount] = useState<Settlement["fromAccount"]>("Business");
  const [toAccount, setToAccount] = useState<Settlement["toAccount"]>("Personal");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const amt = parseInt(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amt || amt <= 0) { setError("Enter a valid settlement amount."); return; }
    if (amt > metrics.unsettledEarned) {
      setError(`Settlement cannot exceed unsettled earned revenue (${formatINR(metrics.unsettledEarned)}).`);
      return;
    }
    const settlement: Settlement = {
      id: `s${Date.now()}`,
      batchId,
      amount: amt,
      date,
      fromAccount,
      toAccount,
      notes: notes.trim(),
    };
    onAdd(settlement);
    onClose();
  };

  return (
    <div className="crt-modal-overlay" onClick={onClose}>
      <div className="crt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crt-modal-header">
          <div>
            <h2>Add Settlement</h2>
            <p>Settle earned revenue for <strong>{batchName}</strong></p>
          </div>
          <button className="crt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="crt-modal-body" onSubmit={handleSubmit}>
          {error && <div className="crt-error">{error}</div>}
          <div className="crt-per-video-hint" style={{ marginBottom: "1rem" }}>
            Unsettled earned revenue: <strong>{formatINR(metrics.unsettledEarned)}</strong>
          </div>
          <div className="crt-form-grid">
            <div className="form-field">
              <label>Amount (₹) *</label>
              <input className="input-pro" type="number" min="1" max={metrics.unsettledEarned} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100000" />
            </div>
            <div className="form-field">
              <label>Settlement Date</label>
              <input className="input-pro" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="crt-form-grid">
            <div className="form-field">
              <label>From Account</label>
              <select className="input-pro select-filter" value={fromAccount} onChange={(e) => setFromAccount(e.target.value as Settlement["fromAccount"])}>
                {FROM_ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>To Account</label>
              <select className="input-pro select-filter" value={toAccount} onChange={(e) => setToAccount(e.target.value as Settlement["toAccount"])}>
                {TO_ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="crt-form-grid single">
            <div className="form-field">
              <label>Notes</label>
              <input className="input-pro" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <div className="crt-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Add Settlement</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSettlementModal;
