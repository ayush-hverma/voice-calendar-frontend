import { useState } from "react";

function toInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({ initial, defaultDate, onCancel, onSubmit, submitting }) {
  const isEdit = Boolean(initial);
  const [summary, setSummary] = useState(initial?.summary || "");
  const [start, setStart] = useState(
    toInputValue(initial?.start) || toInputValue(new Date(defaultDate.setHours(14, 0, 0, 0)))
  );
  const [end, setEnd] = useState(
    toInputValue(initial?.end) || toInputValue(new Date(defaultDate.setHours(15, 0, 0, 0)))
  );
  const [location, setLocation] = useState(initial?.location || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [formError, setFormError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!summary.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (new Date(end) <= new Date(start)) {
      setFormError("End time must be after start time.");
      return;
    }
    setFormError(null);
    onSubmit({
      summary: summary.trim(),
      start_iso: start,
      end_iso: end,
      location: location.trim(),
      description: description.trim(),
    });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{isEdit ? "Edit event" : "New event"}</h3>

        <label>
          Title
          <input value={summary} onChange={(e) => setSummary(e.target.value)} autoFocus />
        </label>

        <div className="form-row">
          <label>
            Start
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            End
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>

        <label>
          Location
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>

        <label>
          Notes
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        {formError && <p className="form-error">{formError}</p>}

        <div className="modal-actions">
          <button type="button" className="modal-btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="modal-btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create event"}
          </button>
        </div>
      </form>
    </div>
  );
}
