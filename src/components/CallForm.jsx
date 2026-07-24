import { useState } from "react";

const COUNTRY_CODES = [
  { name: "India", iso: "IN", dial: "+91" },
  { name: "United States", iso: "US", dial: "+1" },
  { name: "United Kingdom", iso: "GB", dial: "+44" },
  { name: "United Arab Emirates", iso: "AE", dial: "+971" },
  { name: "Australia", iso: "AU", dial: "+61" },
  { name: "Canada", iso: "CA", dial: "+1" },
  { name: "Germany", iso: "DE", dial: "+49" },
  { name: "France", iso: "FR", dial: "+33" },
  { name: "Singapore", iso: "SG", dial: "+65" },
];

export default function CallForm({ onCancel, onSubmit, submitting }) {
  const [dialCode, setDialCode] = useState(COUNTRY_CODES[0].dial);
  const [toNumber, setToNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const fullNumber = `${dialCode}${toNumber.trim()}`;
    if (!/^\+[1-9]\d{6,14}$/.test(fullNumber)) {
      setFormError("Enter a valid phone number, e.g. 9812345678.");
      return;
    }
    setFormError(null);
    onSubmit({
      to_number: fullNumber,
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
          <div className="phone-input-row">
            <select value={dialCode} onChange={(e) => setDialCode(e.target.value)} className="dial-code-select">
              {COUNTRY_CODES.map((c) => (
                <option key={c.iso} value={c.dial}>
                  {c.iso} {c.dial}
                </option>
              ))}
            </select>
            <input
              value={toNumber}
              onChange={(e) => setToNumber(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="9876543210"
              autoFocus
            />
          </div>
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
