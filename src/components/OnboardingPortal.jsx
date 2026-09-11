import { useEffect, useState } from "react";
import {
  COUNTRY_CODES,
  WEEKDAYS,
  JOB_TYPES,
  defaultHours,
  CalendarConnectCard,
  useCalendarConnections,
} from "./business-setup-shared.jsx";
import { fetchCalendarConnections } from "../api.js";

const STEPS = [
  { title: "Business", blurb: "Basic details customers and confirmations will use." },
  { title: "Calendar", blurb: "Grant read & write access so the voice agent can book jobs." },
  { title: "Availability", blurb: "Working hours the agent is allowed to offer." },
  { title: "Job types", blurb: "What kind of work can be booked over the phone." },
  { title: "Review", blurb: "Confirm everything before you go live." },
];

export default function OnboardingPortal({ onFinish }) {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [dialCode, setDialCode] = useState(COUNTRY_CODES[0].dial);
  const [mobile, setMobile] = useState("");
  const {
    connections,
    setConnections,
    connecting,
    error: connectError,
    connectGoogle,
    connectApple,
    disconnect,
  } = useCalendarConnections();
  const [hours, setHours] = useState(defaultHours);
  const [jobTypes, setJobTypes] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const email = connections.google?.account || connections.apple?.account || "";

  useEffect(() => {
    fetchCalendarConnections().then(setConnections).catch(() => {});
  }, [setConnections]);

  function toggleJobType(id) {
    setJobTypes((jt) => (jt.includes(id) ? jt.filter((x) => x !== id) : [...jt, id]));
  }

  function setDay(day, patch) {
    setHours((h) => ({ ...h, [day]: { ...h[day], ...patch } }));
  }

  function validateStep(i) {
    if (i === 0) {
      if (!businessName.trim()) return "Business name is required.";
      if (!/^\d{6,12}$/.test(mobile.trim())) return "Enter a valid mobile number.";
    }
    if (i === 1) {
      if (Object.keys(connections).length === 0) return "Connect at least one calendar to continue.";
    }
    if (i === 2) {
      if (!Object.values(hours).some((d) => d.enabled)) return "Enable at least one working day.";
    }
    if (i === 3) {
      if (jobTypes.length === 0) return "Select at least one job type.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    setSubmitting(true);
    try {
      await onFinish({
        businessName: businessName.trim(),
        mobile: `${dialCode}${mobile.trim()}`,
        email,
        connections,
        hours,
        jobTypes,
      });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="onboarding-page">
      <aside className="onboarding-rail">
        <div>
          <span className="onboarding-brand">Voice Calendar</span>
          <h1 className="onboarding-rail-title">Get your business ready to take calls</h1>
          <p className="onboarding-rail-sub">
            A few steps and the voice agent can start answering calls, checking your calendar, and booking jobs
            on your behalf.
          </p>
        </div>
        <ol className="onboarding-rail-steps">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className={[
                "onboarding-step",
                i === step && "onboarding-step-active",
                i < step && "onboarding-step-done",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="onboarding-step-dot">{i < step ? "✓" : i + 1}</span>
              <div>
                <span className="onboarding-step-title">{s.title}</span>
                <span className="onboarding-step-blurb">{s.blurb}</span>
              </div>
            </li>
          ))}
        </ol>
      </aside>

      <div className="onboarding-main">
        <ol className="onboarding-steps-compact">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className={[
                "onboarding-step-dot",
                i === step && "onboarding-step-active",
                i < step && "onboarding-step-done",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {i < step ? "✓" : i + 1}
            </li>
          ))}
        </ol>

        <div className="onboarding-body">
          <h2 className="onboarding-step-heading">{STEPS[step].title}</h2>
          <p className="onboarding-step-heading-sub">{STEPS[step].blurb}</p>

          {step === 0 && (
            <div className="onboarding-fields">
              <label>
                Business name
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Riverside Plumbing Co."
                  autoFocus
                />
              </label>
              <label>
                Business Contact number
                <div className="phone-input-row">
                  <select value={dialCode} onChange={(e) => setDialCode(e.target.value)} className="dial-code-select">
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.iso} value={c.dial}>
                        {c.iso} {c.dial}
                      </option>
                    ))}
                  </select>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="XXXXXXXXX"
                  />
                </div>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="onboarding-fields">
              <p className="modal-note" style={{ margin: 0 }}>
                Grant read &amp; write access so the voice agent can check availability and book jobs directly on
                your calendar.
              </p>
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
              {email && <p className="modal-note" style={{ margin: 0 }}>Business email address: <strong>{email}</strong> (from connected calendar, not editable)</p>}
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-fields">
              <p className="modal-note" style={{ margin: 0 }}>
                Set the hours you're available for bookings. Calls outside these hours won't be offered slots.
              </p>
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
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-fields">
              <p className="modal-note" style={{ margin: 0 }}>
                What kind of jobs should the voice agent be able to book?
              </p>
              <div className="job-type-list">
                {JOB_TYPES.map((jt) => (
                  <label key={jt.id} className={["job-type-card", jobTypes.includes(jt.id) && "job-type-card-active"].filter(Boolean).join(" ")}>
                    <input
                      type="checkbox"
                      checked={jobTypes.includes(jt.id)}
                      onChange={() => toggleJobType(jt.id)}
                    />
                    <div>
                      <span className="job-type-label">{jt.label}</span>
                      <span className="job-type-detail">{jt.detail}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="onboarding-fields">
              <div className="review-block">
                <h4>Business</h4>
                <p>{businessName}</p>
                <p>{dialCode}{mobile}</p>
                <p>{email}</p>
              </div>
              <div className="review-block">
                <h4>Calendars</h4>
                {Object.keys(connections).length === 0 && <p className="agenda-empty">None connected</p>}
                {Object.entries(connections).map(([platform, c]) => (
                  <p key={platform}>{platform === "google" ? "Google Calendar" : "Apple Calendar"}: {c.account}</p>
                ))}
              </div>
              <div className="review-block">
                <h4>Availability</h4>
                {WEEKDAYS.filter((d) => hours[d].enabled).map((d) => (
                  <p key={d}>{d}: {hours[d].start} – {hours[d].end}</p>
                ))}
              </div>
              <div className="review-block">
                <h4>Job types</h4>
                <p>{JOB_TYPES.filter((jt) => jobTypes.includes(jt.id)).map((jt) => jt.label).join(", ")}</p>
              </div>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
        </div>

        <div className="onboarding-actions">
          <button type="button" className="modal-btn-secondary" onClick={back} disabled={step === 0 || submitting}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="modal-btn-primary" onClick={next}>
              Continue
            </button>
          ) : (
            <button type="button" className="modal-btn-primary" onClick={finish} disabled={submitting}>
              {submitting ? "Saving…" : "Finish setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

