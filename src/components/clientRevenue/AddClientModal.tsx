import React, { useState } from "react";
import { X } from "lucide-react";
import type { Client } from "../../data/clientRevenueMockData";

interface Props {
  onClose: () => void;
  onAdd: (client: Client) => void;
}

const AddClientModal: React.FC<Props> = ({ onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Client name is required."); return; }
    const newClient: Client = {
      id: `c${Date.now()}`,
      name: name.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      status: "active",
      notes: notes.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onAdd(newClient);
    onClose();
  };

  return (
    <div className="crt-modal-overlay" onClick={onClose}>
      <div className="crt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crt-modal-header">
          <div>
            <h2>Add Client</h2>
            <p>Create a new client profile</p>
          </div>
          <button className="crt-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="crt-modal-body" onSubmit={handleSubmit}>
          {error && <div className="crt-error">{error}</div>}
          <div className="crt-form-grid single">
            <div className="form-field">
              <label>Client Name *</label>
              <input className="input-pro" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ABC Brand" />
            </div>
          </div>
          <div className="crt-form-grid">
            <div className="form-field">
              <label>Contact Person</label>
              <input className="input-pro" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Rahul Sharma" />
            </div>
            <div className="form-field">
              <label>Contact Email</label>
              <input className="input-pro" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g. rahul@brand.in" />
            </div>
          </div>
          <div className="crt-form-grid single">
            <div className="form-field">
              <label>Contact Phone</label>
              <input className="input-pro" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 98100 12345" />
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
            <button type="submit" className="btn-primary">Add Client</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
