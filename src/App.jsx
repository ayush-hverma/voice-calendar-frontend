import { useEffect, useState, useCallback } from "react";
import CalendarPanel from "./components/CalendarPanel.jsx";
import ActivityLog from "./components/ActivityLog.jsx";
import ToastStack from "./components/Toast.jsx";
import EventForm from "./components/EventForm.jsx";
import CallForm from "./components/CallForm.jsx";
import { fetchEvents, createEvent, updateEvent, deleteEvent, triggerCall } from "./api.js";
import { monthLabel, monthRangeIso } from "./utils/date.js";

let idCounter = 0;
const nextId = () => ++idCounter;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function useCalendarAccount(account, monthDate) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startIso, endIso } = monthRangeIso(monthDate);
      const data = await fetchEvents(account, startIso, endIso);
      setEvents(data.events);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [account, monthDate]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, setEvents, loading, error, reload: load };
}

export default function App() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [toasts, setToasts] = useState([]);
  const [log, setLog] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [syncingUser, setSyncingUser] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState(false);
  const [formState, setFormState] = useState(null); // { mode: "create"|"edit", event?, date }
  const [submitting, setSubmitting] = useState(false);
  const [callFormOpen, setCallFormOpen] = useState(false);
  const [calling, setCalling] = useState(false);

  const user = useCalendarAccount("user", monthDate);
  const provider = useCalendarAccount("provider", monthDate);

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
    setSyncingProvider(true);
    await Promise.all([user.reload(), provider.reload()]);
    setSyncingProvider(false);
  }

  async function handleFormSubmit(fields) {
    setSubmitting(true);
    try {
      if (formState.mode === "create") {
        await createEvent(fields);
        pushToast("success", "Event created", "Added to user's Apple Calendar");
        pushLog("create", `Created "${fields.summary}"`);
      } else {
        await updateEvent(formState.event.uid, fields);
        pushToast("success", "Event updated", "Change saved to user's Apple Calendar");
        pushLog("update", `Updated "${fields.summary}"`);
      }
      setFormState(null);
      await refreshBoth();
      pushToast("success", "Mirrored to provider", "Provider's Apple Calendar is in sync");
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
      await deleteEvent(event.uid);
      pushToast("success", "Event deleted", "Removed from user's Apple Calendar");
      pushLog("delete", `Deleted "${event.summary}"`);
      await refreshBoth();
      pushToast("success", "Mirrored to provider", "Removed from provider's Apple Calendar");
      pushLog("delete", "Deletion mirrored to provider calendar");
    } catch (e) {
      pushToast("error", "Delete failed", e.message);
      pushLog("error", `Delete failed: ${e.message}`);
    }
  }

  async function handleTriggerCall(fields) {
    setCalling(true);
    try {
      await triggerCall(fields);
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

  async function simulateCall() {
    if (simulating) return;
    setSimulating(true);
    pushToast("info", "Incoming call", "ElevenLabs voice agent connected");
    pushLog("call", "Voice agent call started");
    await sleep(1200);

    pushToast("sync", "Checking availability", "Reading calendar for open slots");
    pushLog("info", "Agent checked availability on user calendar");
    await sleep(1400);

    const appointment = {
      uid: `demo-${nextId()}`,
      summary: "Plumbing appointment — leaky faucet",
      start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 14, 0).toISOString(),
      end: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 15, 0).toISOString(),
      location: "123 Main St",
      description: "Booked live during the call",
    };

    setSyncingUser(true);
    await sleep(900);
    user.setEvents((evts) => [...evts, appointment]);
    setSyncingUser(false);
    pushToast("success", "Event created", "Added to user's Apple Calendar");
    pushLog("create", "Event created on user calendar");

    await sleep(500);

    setSyncingProvider(true);
    await sleep(900);
    provider.setEvents((evts) => [...evts, appointment]);
    setSyncingProvider(false);
    pushToast("success", "Mirrored to provider", "Added to provider's Apple Calendar");
    pushLog("create", "Event mirrored to provider calendar");

    await sleep(600);
    pushToast("info", "Call ended", "Appointment confirmed with caller");
    pushLog("call", "Call ended — appointment confirmed");
    setSimulating(false);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Voice Calendar</h1>
          <p className="app-subtitle">Live sync — user &amp; provider Apple Calendars</p>
        </div>
        <div className="app-controls">
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
          {/* <button className="simulate-btn" onClick={simulateCall} disabled={simulating}>
            {simulating ? "Call in progress…" : "Simulate voice call"}
          </button> */}
          <button className="simulate-btn" onClick={() => setCallFormOpen(true)}>
            Trigger call
          </button>
        </div>
      </header>

      <main className="app-body">
        <div className="calendars-row">
          <CalendarPanel
            title="User"
            accountLabel="User's iCloud Calendar"
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
            accountLabel="Business's iCloud Calendar"
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
