import React from "react";
import { AlertTriangle, X } from "lucide-react";
import "../styles/Dashboard.css";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "danger"
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-pro" onClick={onCancel}>
      <div className="modal-pro confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-pro">
          <div className="confirm-header">
            <div className={`confirm-icon ${type}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2>{title}</h2>
              <p>{message}</p>
            </div>
          </div>
          <button className="modal-close-pro" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-pro">
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className={`btn-primary ${type === "danger" ? "btn-danger" : ""}`}
              onClick={() => {
                onConfirm();
                onCancel();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
