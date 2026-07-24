import { useState } from "react";

export default function CallForm({ onCancel, onSubmit, submitting }) {
  const [toNumber, setToNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!/^\+[1-9]\d{6,14}$/.test(toNumber.trim())) {
      setFormError("Enter a valid phone number in E.164 format, e.g. +919812345678.");
      return;
    }
    setFormError(null);
    onSubmit({
      to_number: toNumber.trim(),
      customer_name: customerName.trim() || null,
      reason: reason.trim() || null,
    });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Trigger voice call</h3>
        <p className="modal-note">Places a real outbound call via the ElevenLabs voice agent.</p>

        <label>
          Phone number
          <input
            value={toNumber}
            onChange={(e) => setToNumber(e.target.value)}
            placeholder="+919812345678"
            autoFocus
          />
        </label>

        <label>
          Customer name (optional)
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </label>

        <label>
          Reason (optional)
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Follow-up on plumbing quote request"
          />
        </label>

        {formError && <p className="form-error">{formError}</p>}

        <div className="modal-actions">
          <button type="button" className="modal-btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="modal-btn-primary" disabled={submitting}>
            {submitting ? "Calling…" : "Call now"}
          </button>
        </div>
      </form>
    </div>
  );
}
