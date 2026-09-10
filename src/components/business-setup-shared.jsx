import { useCallback, useEffect, useState } from "react";
import { BASE_URL } from "../api.js";
import { getToken } from "../utils/auth.js";

export const COUNTRY_CODES = [
  { iso: "IN", dial: "+91" },
  { iso: "US", dial: "+1" },
  { iso: "GB", dial: "+44" },
  { iso: "AE", dial: "+971" },
  { iso: "AU", dial: "+61" },
];

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const JOB_TYPES = [
  { id: "callout", label: "Callout", detail: "Urgent on-site visit, same-day" },
  { id: "quote", label: "Quote", detail: "In-person estimate before work is booked" },
  { id: "scheduled", label: "Scheduled work", detail: "Planned job booked ahead of time" },
];

export function defaultHours() {
  return Object.fromEntries(
    WEEKDAYS.map((d) => [d, { enabled: !["Sat", "Sun"].includes(d), start: "09:00", end: "17:00" }])
  );
}

/**
 * Drives real calendar connect/disconnect: Google via an OAuth popup +
 * postMessage handshake with the backend, Apple via an app-specific
 * password verified server-side against iCloud CalDAV.
 */
export function useCalendarConnections(initial = {}) {
  const [connections, setConnections] = useState(initial);
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    function onMessage(e) {
      if (!e.data || e.data.type !== "calendar-oauth") return;
      setConnecting(null);
      if (e.data.ok) {
        setError(null);
        setConnections((c) => ({ ...c, [e.data.platform]: { account: e.data.account } }));
      } else {
        setError(e.data.error || "Connection failed");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const connectGoogle = useCallback(() => {
    setError(null);
    setConnecting("google");
    const token = getToken();
    window.open(
      `${BASE_URL}/oauth/google/authorize?token=${encodeURIComponent(token)}`,
      "google-oauth",
      "width=520,height=650"
    );
  }, []);

  const connectApple = useCallback(async (email, password) => {
    setError(null);
    setConnecting("apple");
    try {
      const res = await fetch(`${BASE_URL}/oauth/apple/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ email, app_specific_password: password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || "Could not connect Apple Calendar");
      setConnections((c) => ({ ...c, apple: { account: body.account } }));
    } catch (e) {
      setError(e.message);
    } finally {
      setConnecting(null);
    }
  }, []);

  const disconnect = useCallback((platform) => {
    setConnections((c) => {
      const next = { ...c };
      delete next[platform];
      return next;
    });
    fetch(`${BASE_URL}/oauth/${platform}/connection`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => {});
  }, []);

  return { connections, setConnections, connecting, error, connectGoogle, connectApple, disconnect };
}

export function CalendarConnectCard({ platform, label, note, connection, connecting, onConnectGoogle, onConnectApple, onDisconnect }) {
  const [appleEmail, setAppleEmail] = useState("");
  const [applePassword, setApplePassword] = useState("");

  return (
    <div className="connect-card">
      <div className="connect-card-head">
        <span className="connect-platform">{label}</span>
        {connection && <span className="pill pill-live">● Connected</span>}
      </div>
      <p className="connect-note">{note}</p>

      {connection ? (
        <div className="connect-status">
          <span className="connect-account">{connection.account}</span>
          <span className="connect-scopes">Read &amp; write access to events</span>
          <button type="button" className="modal-btn-secondary" onClick={() => onDisconnect(platform)}>
            Disconnect
          </button>
        </div>
      ) : platform === "apple" ? (
        <form
          className="apple-connect-form"
          onSubmit={(e) => {
            e.preventDefault();
            onConnectApple(appleEmail.trim(), applePassword);
          }}
        >
          <input
            type="email"
            placeholder="Apple ID email"
            value={appleEmail}
            onChange={(e) => setAppleEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="App-specific password"
            value={applePassword}
            onChange={(e) => setApplePassword(e.target.value)}
            required
          />
          <button type="submit" className="modal-btn-primary connect-btn" disabled={connecting}>
            {connecting ? "Connecting…" : "Connect Apple Calendar"}
          </button>
        </form>
      ) : (
        <button type="button" className="modal-btn-primary connect-btn" onClick={onConnectGoogle} disabled={connecting}>
          {connecting ? "Connecting…" : `Connect ${label}`}
        </button>
      )}
    </div>
  );
}
