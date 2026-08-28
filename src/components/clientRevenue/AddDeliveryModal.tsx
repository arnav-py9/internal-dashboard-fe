import React, { useState } from "react";
import { X } from "lucide-react";
import type { DeliveryLog } from "../../data/clientRevenueMockData";
import type { BatchMetrics } from "../../utils/clientRevenueCalculations";

interface Props {
  batchId: string;
  batchName: string;
  committedVideos: number;
  metrics: BatchMetrics;
  onClose: () => void;
  onAdd: (log: DeliveryLog) => void;
}

const AddDeliveryModal: React.FC<Props> = ({ batchId, batchName, committedVideos, metrics, onClose, onAdd }) => {
  const [videos, setVideos] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const num = parseInt(videos) || 0;
  const newTotal = metrics.videosDelivered + num;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!num || num <= 0) { setError("Enter a valid number of videos."); return; }
    if (newTotal > committedVideos) {
      setError(`Cannot exceed committed videos (${committedVideos}). Max you can add: ${metrics.pendingVideos}.`);
      return;
    }
    const log: DeliveryLog = {
      id: `d${Date.now()}`,
      batchId,
      videosCompleted: num,
      date,
      notes: notes.trim(),
    };
    onAdd(log);
    onClose();
  };

  return (
    <div className="crt-modal-overlay" onClick={onClose}>
      <div className="crt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crt-modal-header">
          <div>
            <h2>Mark Videos Completed</h2>
            <p>Record delivered videos for <strong>{batchName}</strong></p>
          </div>
          <button className="crt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="crt-modal-body" onSubmit={handleSubmit}>
          {error && <div className="crt-error">{error}</div>}
          <div className="crt-per-video-hint" style={{ marginBottom: "1rem" }}>
            Current progress: <strong>{metrics.videosDelivered} / {committedVideos}</strong> videos delivered
            {num > 0 && <span> → New: <strong>{newTotal} / {committedVideos}</strong></span>}
          </div>
          <div className="crt-form-grid">
            <div className="form-field">
              <label>Number of Videos *</label>
              <input className="input-pro" type="number" min="1" max={metrics.pendingVideos} value={videos} onChange={(e) => setVideos(e.target.value)} placeholder={`Max: ${metrics.pendingVideos}`} />
            </div>
            <div className="form-field">
              <label>Delivery Date</label>
              <input className="input-pro" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
            <button type="submit" className="btn-primary">Mark Completed</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeliveryModal;
