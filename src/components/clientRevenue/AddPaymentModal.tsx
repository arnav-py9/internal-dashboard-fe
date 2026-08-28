import React, { useState } from "react";
import { X } from "lucide-react";
import type { Payment } from "../../data/clientRevenueMockData";

interface Props {
  batchId: string;
  batchName: string;
  onClose: () => void;
  onAdd: (payment: Payment) => void;
}

const ACCOUNTS = ["Business", "Personal", "Slice", "Other"] as const;

const AddPaymentModal: React.FC<Props> = ({ batchId, batchName, onClose, onAdd }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receivedIn, setReceivedIn] = useState<Payment["receivedIn"]>("Business");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    const payment: Payment = {
      id: `p${Date.now()}`,
      batchId,
      amount: amt,
      date,
      receivedIn,
      notes: notes.trim(),
    };
    onAdd(payment);
    onClose();
  };

  return (
    <div className="crt-modal-overlay" onClick={onClose}>
      <div className="crt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crt-modal-header">
          <div>
            <h2>Add Payment</h2>
            <p>Record a client payment for <strong>{batchName}</strong></p>
          </div>
          <button className="crt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="crt-modal-body" onSubmit={handleSubmit}>
          {error && <div className="crt-error">{error}</div>}
          <div className="crt-form-grid">
            <div className="form-field">
              <label>Amount (₹) *</label>
              <input className="input-pro" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 135000" />
            </div>
            <div className="form-field">
              <label>Payment Date</label>
              <input className="input-pro" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="crt-form-grid single">
            <div className="form-field">
              <label>Received In Account</label>
              <select className="input-pro select-filter" value={receivedIn} onChange={(e) => setReceivedIn(e.target.value as Payment["receivedIn"])}>
                {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
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
            <button type="submit" className="btn-primary">Add Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;
