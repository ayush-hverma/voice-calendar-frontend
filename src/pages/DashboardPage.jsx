import { useEffect, useState, useCallback } from "react";
import CalendarPanel from "../components/CalendarPanel.jsx";
import ActivityLog from "../components/ActivityLog.jsx";
import ToastStack from "../components/Toast.jsx";
import EventForm from "../components/EventForm.jsx";
import CallForm from "../components/CallForm.jsx";
import { fetchEvents, createEvent, updateEvent, deleteEvent, triggerCall } from "../api.js";
import { monthLabel, monthRangeIso } from "../utils/date.js";

let idCounter = 0;
const nextId = () => ++idCounter;

function useCalendarAccount(account, monthDate, provider) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startIso, endIso } = monthRangeIso(monthDate);
      const data = await fetchEvents(account, startIso, endIso, provider);
      setEvents(data.events);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [account, monthDate, provider]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, setEvents, loading, error, reload: load };
}

const PROVIDER_TABS = [
  { id: "apple", label: "Apple Calendar", accountLabel: "iCloud Calendar" },
  { id: "google", label: "Google Calendar", accountLabel: "Google Calendar" },
];

export default function DashboardPage({ profile, onOpenSetup, onLogout }) {
  const [calendarProvider, setCalendarProvider] = useState("apple"); // "apple" | "google"
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [toasts, setToasts] = useState([]);
  const [log, setLog] = useState([]);
  const [syncingUser, setSyncingUser] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState(false);
  const [formState, setFormState] = useState(null); // { mode: "create"|"edit", event?, date }
  const [submitting, setSubmitting] = useState(false);
  const [callFormOpen, setCallFormOpen] = useState(false);
  const [calling, setCalling] = useState(false);

  const activeTab = PROVIDER_TABS.find((t) => t.id === calendarProvider);
  const user = useCalendarAccount("user", monthDate, calendarProvider);
  const provider = useCalendarAccount("provider", monthDate, calendarProvider);

  const pushToast = useCallback((type, title, detail) => {
    const id = nextId();
    setToasts((t) => [...t, { id, type, title, detail }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const pushLog = useCallback((kind, text) => {
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
    setLog((l) => [{ id: nextId(), kind, text, time }, ...l].slice(0, 30));
  }, []);

  function changeMonth(delta) {
    setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  async function refreshBoth() {
    setSyncingUser(true);
    setSyncingProvider(true);
    await Promise.all([user.reload(), provider.reload()]);
    setSyncingUser(false);
    setSyncingProvider(false);
  }

  async function handleSyncClick() {
    await refreshBoth();
    pushToast("success", "Calendars synced", "Latest events pulled from both calendars");
  }

  async function handleFormSubmit(fields) {
    setSubmitting(true);
    try {
      if (formState.mode === "create") {
        await createEvent(fields, calendarProvider);
        pushToast("success", "Event created", `Added to user's ${activeTab.accountLabel}`);
        pushLog("create", `Created "${fields.summary}"`);
      } else {
        await updateEvent(formState.event.uid, fields, calendarProvider);
        pushToast("success", "Event updated", `Change saved to user's ${activeTab.accountLabel}`);
        pushLog("update", `Updated "${fields.summary}"`);
      }
      setFormState(null);
      await refreshBoth();
      pushToast("success", "Mirrored to provider", `Provider's ${activeTab.accountLabel} is in sync`);
      pushLog(formState.mode === "create" ? "create" : "update", "Change mirrored to provider calendar");
    } catch (e) {
      pushToast("error", "Save failed", e.message);
      pushLog("error", `Save failed: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteEvent(event) {
    if (!window.confirm(`Delete "${event.summary}"? This removes it from both calendars.`)) return;
    try {
      await deleteEvent(event.uid, calendarProvider);
      pushToast("success", "Event deleted", `Removed from user's ${activeTab.accountLabel}`);
      pushLog("delete", `Deleted "${event.summary}"`);
      await refreshBoth();
      pushToast("success", "Mirrored to provider", `Removed from provider's ${activeTab.accountLabel}`);
      pushLog("delete", "Deletion mirrored to provider calendar");
    } catch (e) {
      pushToast("error", "Delete failed", e.message);
      pushLog("error", `Delete failed: ${e.message}`);
    }
  }

  async function handleTriggerCall(fields) {
    setCalling(true);
    try {
      await triggerCall({ ...fields, provider: activeTab.id });
      pushToast("success", "Call placed", `Dialing ${fields.to_number}`);
      pushLog("call", `Triggered outbound call to ${fields.to_number}`);
      setCallFormOpen(false);
    } catch (e) {
      pushToast("error", "Call failed", e.message);
      pushLog("error", `Call trigger failed: ${e.message}`);
    } finally {
      setCalling(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>{profile.businessName || "Voice Calendar"}</h1>
          <p className="app-subtitle">Live sync — user &amp; provider {activeTab.label}s</p>
        </div>
        <div className="app-controls">
          <div className="provider-tabs">
            {PROVIDER_TABS.map((t) => (
              <button
                key={t.id}
                className={["provider-tab", t.id === calendarProvider && "provider-tab-active"].filter(Boolean).join(" ")}
                onClick={() => setCalendarProvider(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="nav-btn" onClick={() => changeMonth(-1)}>
            ‹
          </button>
          <span className="month-label">{monthLabel(monthDate)}</span>
          <button className="nav-btn" onClick={() => changeMonth(1)}>
            ›
          </button>
          <button className="today-btn" onClick={() => { setMonthDate(new Date()); setSelectedDate(new Date()); }}>
            Today
          </button>
          <button className="simulate-btn" onClick={() => setCallFormOpen(true)}>
            Trigger call
          </button>
          <button
            className="today-btn"
            onClick={handleSyncClick}
            disabled={syncingUser || syncingProvider}
            title="Refresh both calendars"
          >
            {syncingUser || syncingProvider ? "Syncing…" : "Sync"}
          </button>
          <button className="today-btn" onClick={onOpenSetup}>
            Profile Settings
          </button>
          <button className="today-btn" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="app-body">
        <div className="calendars-row">
          <CalendarPanel
            title="User"
            accountLabel={`User's ${activeTab.accountLabel}`}
            accent="#0a84ff"
            monthDate={monthDate}
            events={user.events}
            loading={user.loading}
            error={user.error}
            onRetry={user.reload}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            syncing={syncingUser}
            editable
            onAddEvent={(date) => setFormState({ mode: "create", date: new Date(date) })}
            onEditEvent={(event) => setFormState({ mode: "edit", event, date: new Date(event.start) })}
            onDeleteEvent={handleDeleteEvent}
          />
          <CalendarPanel
            title="Plumber"
            accountLabel={`Business's ${activeTab.accountLabel}`}
            accent="#ff9f0a"
            monthDate={monthDate}
            events={provider.events}
            loading={provider.loading}
            error={provider.error}
            onRetry={provider.reload}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            syncing={syncingProvider}
          />
        </div>
        <ActivityLog entries={log} />
      </main>

      {formState && (
        <EventForm
          initial={formState.mode === "edit" ? formState.event : null}
          defaultDate={formState.date}
          submitting={submitting}
          onCancel={() => setFormState(null)}
          onSubmit={handleFormSubmit}
        />
      )}

      {callFormOpen && (
        <CallForm
          submitting={calling}
          onCancel={() => setCallFormOpen(false)}
          onSubmit={handleTriggerCall}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
