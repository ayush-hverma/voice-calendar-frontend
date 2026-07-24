const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function fetchEvents(account, startIso, endIso) {
  const url = `${BASE_URL}/calendar/events?account=${account}&start_iso=${encodeURIComponent(
    startIso
  )}&end_iso=${encodeURIComponent(endIso)}`;

  const res = await fetch(url);
  return handleResponse(res);
}

export async function createEvent(fields) {
  const res = await fetch(`${BASE_URL}/calendar/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

export async function updateEvent(uid, fields) {
  const res = await fetch(`${BASE_URL}/calendar/events/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

export async function deleteEvent(uid) {
  const res = await fetch(`${BASE_URL}/calendar/events/${encodeURIComponent(uid)}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

export async function triggerCall(fields) {
  const res = await fetch(`${BASE_URL}/calls/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}
