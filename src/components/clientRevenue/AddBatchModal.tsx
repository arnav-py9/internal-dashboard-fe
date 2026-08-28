import React, { useState } from "react";
import { X } from "lucide-react";
import type { Batch, Client } from "../../data/clientRevenueMockData";
import { formatINR } from "../../utils/clientRevenueCalculations";

interface Props {
  clients: Client[];
  batches: Batch[];
  defaultClientId?: string;
  onClose: () => void;
  onAdd: (batch: Batch) => void;
}

const AddBatchModal: React.FC<Props> = ({ clients, batches, defaultClientId, onClose, onAdd }) => {
  const [clientId, setClientId] = useState(defaultClientId || "");
  const [batchName, setBatchName] = useState("");
  const [committedVideos, setCommittedVideos] = useState("");
  const [committedValue, setCommittedValue] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const videos = parseInt(committedVideos) || 0;
  const value = parseInt(committedValue) || 0;
  const perVideo = videos > 0 && value > 0 ? value / videos : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { setError("Please select a client."); return; }
    if (!batchName.trim()) { setError("Batch name is required."); return; }
    if (videos <= 0) { setError("Committed videos must be greater than 0."); return; }
    if (value <= 0) { setError("Committed value must be greater than 0."); return; }
    // Only one active batch per client
    const hasActive = batches.some((b) => b.clientId === clientId && b.status === "active");
    if (hasActive) { setError("This client already has an active batch. Complete or end it first."); return; }

    const newBatch: Batch = {
      id: `b${Date.now()}`,
      clientId,
      batchName: batchName.trim(),
      committedVideos: videos,
      committedValue: value,
      startDate,
      expectedEndDate,
      status: "active",
      notes: notes.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onAdd(newBatch);
    onClose();
  };

  return (
    <div className="crt-modal-overlay" onClick={onClose}>
      <div className="crt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crt-modal-header">
          <div>
            <h2>Add Batch</h2>
            <p>Create a new video batch for a client</p>
          </div>
          <button className="crt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="crt-modal-body" onSubmit={handleSubmit}>
          {error && <div className="crt-error">{error}</div>}
          <div className="crt-form-grid">
            <div className="form-field">
              <label>Client *</label>
              <select className="input-pro select-filter" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Select client…</option>
                {clients.filter((c) => c.status === "active").map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Batch Name *</label>
              <input className="input-pro" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. August Batch" />
            </div>
          </div>
          <div className="crt-form-grid">
            <div className="form-field">
              <label>Committed Videos *</label>
              <input className="input-pro" type="number" min="1" value={committedVideos} onChange={(e) => setCommittedVideos(e.target.value)} placeholder="e.g. 27" />
            </div>
            <div className="form-field">
              <label>Committed Value (₹) *</label>
              <input className="input-pro" type="number" min="1" value={committedValue} onChange={(e) => setCommittedValue(e.target.value)} placeholder="e.g. 270000" />
            </div>
          </div>
          {perVideo > 0 && (
            <div className="crt-per-video-hint">
              Per-video value: <strong>{formatINR(perVideo)}</strong> per video
            </div>
          )}
          <div className="crt-form-grid">
            <div className="form-field">
              <label>Start Date</label>
              <input className="input-pro" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Expected End Date</label>
              <input className="input-pro" type="date" value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)} />
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
            <button type="submit" className="btn-primary">Add Batch</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatchModal;
