import { useEffect, useState } from "react";
import {
  COUNTRY_CODES,
  WEEKDAYS,
  JOB_TYPES,
  defaultHours,
  CalendarConnectCard,
  useCalendarConnections,
} from "../components/business-setup-shared.jsx";
import { saveProfile } from "../utils/profile.js";
import { fetchCalendarConnections } from "../api.js";

function splitMobile(mobile) {
  const dial = COUNTRY_CODES.find((c) => mobile?.startsWith(c.dial))?.dial || COUNTRY_CODES[0].dial;
  return { dial, rest: mobile ? mobile.slice(dial.length) : "" };
}

export default function SettingsPage({ profile, onSave, onBack }) {
  const [businessName, setBusinessName] = useState(profile.businessName || "");
  const initialMobile = splitMobile(profile.mobile);
  const [dialCode, setDialCode] = useState(initialMobile.dial);
  const [mobile, setMobile] = useState(initialMobile.rest);
  const [email, setEmail] = useState(profile.email || "");
  const {
    connections,
    setConnections,
    connecting,
    error: connectError,
    connectGoogle,
    connectApple,
    disconnect,
  } = useCalendarConnections(profile.connections || {});
  const [hours, setHours] = useState(profile.hours || defaultHours());
  const [jobTypes, setJobTypes] = useState(profile.jobTypes || []);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchCalendarConnections().then(setConnections).catch(() => {});
  }, [setConnections]);

  function toggleJobType(id) {
    setJobTypes((jt) => (jt.includes(id) ? jt.filter((x) => x !== id) : [...jt, id]));
  }

  function setDay(day, patch) {
    setHours((h) => ({ ...h, [day]: { ...h[day], ...patch } }));
  }

  async function handleSave() {
    if (!businessName.trim()) return setError("Business name is required.");
    if (!/^\d{6,12}$/.test(mobile.trim())) return setError("Enter a valid mobile number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (Object.keys(connections).length === 0) return setError("Connect at least one calendar.");
    if (!Object.values(hours).some((d) => d.enabled)) return setError("Enable at least one working day.");
    if (jobTypes.length === 0) return setError("Select at least one job type.");

    const next = {
      businessName: businessName.trim(),
      mobile: `${dialCode}${mobile.trim()}`,
      email: email.trim(),
      connections,
      hours,
      jobTypes,
    };
    setError(null);
    try {
      const saved = await saveProfile(next);
      setSaved(true);
      onSave(saved);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Business settings</h1>
          <p className="app-subtitle">Update your profile, calendar connections, and availability.</p>
        </div>
        <div className="app-controls">
          {saved && <span className="pill pill-live">Saved</span>}
          <button className="today-btn" onClick={onBack}>
            ‹ Back to calendar
          </button>
        </div>
      </header>

      <main className="settings-body">
        <section className="settings-section">
          <h3>Business</h3>
          <div className="onboarding-fields">
            <label>
              Business name
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </label>
            <label>
              Business contact number
              <div className="phone-input-row">
                <select value={dialCode} onChange={(e) => setDialCode(e.target.value)} className="dial-code-select">
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.iso} value={c.dial}>
                      {c.iso} {c.dial}
                    </option>
                  ))}
                </select>
                <input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, ""))} />
              </div>
            </label>
            <label>
              Business email address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h3>Calendar connections</h3>
          <div className="onboarding-fields">
            <CalendarConnectCard
              platform="google"
              label="Google Calendar"
              note="OAuth sign-in via Google. You'll be asked to approve calendar read/write scope."
              connection={connections.google}
              connecting={connecting === "google"}
              otherConnected={!!connections.apple}
              onConnectGoogle={connectGoogle}
              onDisconnect={disconnect}
            />
            <CalendarConnectCard
              platform="apple"
              label="Apple Calendar"
              note="Sign in with your Apple ID email and an app-specific password (generate one at appleid.apple.com)."
              connection={connections.apple}
              connecting={connecting === "apple"}
              otherConnected={!!connections.google}
              onConnectApple={connectApple}
              onDisconnect={disconnect}
            />
            {connectError && <p className="form-error">{connectError}</p>}
          </div>
        </section>

        <section className="settings-section">
          <h3>Availability</h3>
          <div className="hours-table">
            {WEEKDAYS.map((day) => (
              <div key={day} className="hours-row">
                <label className="hours-day">
                  <input
                    type="checkbox"
                    checked={hours[day].enabled}
                    onChange={(e) => setDay(day, { enabled: e.target.checked })}
                  />
                  {day}
                </label>
                <input
                  type="time"
                  value={hours[day].start}
                  disabled={!hours[day].enabled}
                  onChange={(e) => setDay(day, { start: e.target.value })}
                />
                <span className="hours-sep">–</span>
                <input
                  type="time"
                  value={hours[day].end}
                  disabled={!hours[day].enabled}
                  onChange={(e) => setDay(day, { end: e.target.value })}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3>Job types</h3>
          <div className="job-type-list">
            {JOB_TYPES.map((jt) => (
              <label
                key={jt.id}
                className={["job-type-card", jobTypes.includes(jt.id) && "job-type-card-active"].filter(Boolean).join(" ")}
              >
                <input type="checkbox" checked={jobTypes.includes(jt.id)} onChange={() => toggleJobType(jt.id)} />
                <div>
                  <span className="job-type-label">{jt.label}</span>
                  <span className="job-type-detail">{jt.detail}</span>
                </div>
              </label>
            ))}
          </div>
        </section>

        {error && <p className="form-error">{error}</p>}

        <div className="settings-actions">
          <button type="button" className="modal-btn-primary" onClick={handleSave}>
            Save changes
          </button>
        </div>
      </main>
    </div>
  );
}
