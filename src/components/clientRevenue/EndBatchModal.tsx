import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { Batch } from "../../data/clientRevenueMockData";
import type { BatchMetrics } from "../../utils/clientRevenueCalculations";
import { formatINR } from "../../utils/clientRevenueCalculations";

interface Props {
  batch: Batch;
  metrics: BatchMetrics;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const EndBatchModal: React.FC<Props> = ({ batch, metrics, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) { setError("Please provide a reason."); return; }
    onConfirm(reason.trim());
    onClose();
  };

  return (
    <div className="crt-modal-overlay" onClick={onClose}>
      <div className="crt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crt-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2>End Batch Early?</h2>
              <p>This action cannot be undone</p>
            </div>
          </div>
          <button className="crt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="crt-modal-body">
          {error && <div className="crt-error">{error}</div>}
          <div className="crt-warning-block">
            <p>
              <strong>Delivered:</strong> {metrics.videosDelivered} / {batch.committedVideos} videos<br />
              <strong>Remaining:</strong> {metrics.pendingVideos} videos<br />
              <strong>Unrealized value:</strong> {formatINR(metrics.unrealizedValue)}
            </p>
          </div>
          <div className="form-field" style={{ marginBottom: "1.5rem" }}>
            <label>Reason for ending early *</label>
            <input className="input-pro" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Client paused project" />
          </div>
          <div className="crt-modal-actions">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary"
              style={{ background: "#dc2626", boxShadow: "0 4px 12px rgba(220,38,38,0.2)" }}
              onClick={handleConfirm}
            >
              End Batch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndBatchModal;
