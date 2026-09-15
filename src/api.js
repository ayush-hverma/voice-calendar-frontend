import { getToken } from "./utils/auth.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export { BASE_URL };

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchEvents(account, startIso, endIso, provider = "apple") {
  const url = `${BASE_URL}/calendar/events?account=${account}&provider=${provider}&start_iso=${encodeURIComponent(
    startIso
  )}&end_iso=${encodeURIComponent(endIso)}`;

  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createEvent(fields, provider = "apple") {
  const res = await fetch(`${BASE_URL}/calendar/events?provider=${provider}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

export async function updateEvent(uid, fields, provider = "apple") {
  const res = await fetch(`${BASE_URL}/calendar/events/${encodeURIComponent(uid)}?provider=${provider}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

export async function deleteEvent(uid, provider = "apple") {
  const res = await fetch(`${BASE_URL}/calendar/events/${encodeURIComponent(uid)}?provider=${provider}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchPendingReminders(hoursAhead) {
  const url = hoursAhead
    ? `${BASE_URL}/calendar/pending-reminders?hours_ahead=${hoursAhead}`
    : `${BASE_URL}/calendar/pending-reminders`;
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse(res);
}

export async function triggerCall(fields) {
  const res = await fetch(`${BASE_URL}/calls/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function fetchMe() {
  const res = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function fetchCalendarConnections() {
  const res = await fetch(`${BASE_URL}/oauth/connections`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function fetchBusinessProfile() {
  const res = await fetch(`${BASE_URL}/business/profile`, { headers: authHeaders() });
  if (res.status === 404) return null;
  return handleResponse(res);
}

export async function saveBusinessProfile(profile) {
  const res = await fetch(`${BASE_URL}/business/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(profile),
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
