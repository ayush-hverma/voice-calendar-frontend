import { isSameDay, monthGrid, weekdayLabels, formatTime, formatDayHeading } from "../utils/date.js";

function DaySkeleton() {
  return (
    <div className="month-grid">
      {Array.from({ length: 42 }).map((_, i) => (
        <div key={i} className="day-cell skeleton-cell">
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  );
}

export default function CalendarPanel({
  title,
  accountLabel,
  accent,
  monthDate,
  events,
  loading,
  error,
  onRetry,
  selectedDate,
  onSelectDate,
  syncing,
  editable,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}) {
  const days = monthGrid(monthDate);
  const today = new Date();

  const eventsByDay = (day) =>
    events.filter((e) => isSameDay(new Date(e.start), day));

  const selectedEvents = eventsByDay(selectedDate).sort(
    (a, b) => new Date(a.start) - new Date(b.start)
  );

  return (
    <section className="calendar-panel" style={{ "--accent": accent }}>
      <header className="panel-header">
        <div>
          <h2>{title}</h2>
          <span className="account-label">{accountLabel}</span>
        </div>
        <div className="panel-status">
          {syncing && <span className="pill pill-syncing">Syncing…</span>}
          {!syncing && !loading && !error && <span className="pill pill-live">● Live</span>}
          {editable && (
            <button className="add-event-btn" onClick={() => onAddEvent(selectedDate)}>
              + Event
            </button>
          )}
        </div>
      </header>

      <div className="weekday-row">
        {weekdayLabels().map((w) => (
          <div key={w} className="weekday-label">
            {w}
          </div>
        ))}
      </div>

      {loading && <DaySkeleton />}

      {!loading && error && (
        <div className="error-banner">
          <p>Could not load {accountLabel}.</p>
          <p className="error-detail">{error}</p>
          <button className="retry-btn" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="month-grid">
          {days.map((day) => {
            const inMonth = day.getMonth() === monthDate.getMonth();
            const dayEvents = eventsByDay(day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                className={[
                  "day-cell",
                  !inMonth && "day-cell-muted",
                  isToday && "day-cell-today",
                  isSelected && "day-cell-selected",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelectDate(day)}
              >
                <span className="day-number">{day.getDate()}</span>
                {dayEvents.length > 0 && (
                  <span className="event-dots">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.uid} className="event-dot" />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!loading && !error && (
        <div className="agenda">
          <h3>{formatDayHeading(selectedDate)}</h3>
          {selectedEvents.length === 0 && (
            <p className="agenda-empty">No events scheduled.</p>
          )}
          <ul className="agenda-list">
            {selectedEvents.map((e) => (
              <li key={e.uid} className="agenda-item">
                <span className="agenda-time">{formatTime(e.start)}</span>
                <div className="agenda-info">
                  <span className="agenda-title">{e.summary}</span>
                  {e.location && <span className="agenda-location">{e.location}</span>}
                </div>
                {editable && (
                  <div className="agenda-actions">
                    <button className="icon-btn" title="Edit" onClick={() => onEditEvent(e)}>
                      ✎
                    </button>
                    <button className="icon-btn" title="Delete" onClick={() => onDeleteEvent(e)}>
                      🗑
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
