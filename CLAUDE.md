# CLAUDE.md

Vite + React (no router library) dashboard for business owner accounts (multiple, fully separate — see backend `accounts` collection). Talks to `backend/` over plain `fetch` (`src/api.js`), `VITE_API_BASE_URL` env var (defaults `http://localhost:8000`).

## Commands

```bash
npm install
npm run dev       # vite dev server
npm run build
npm run preview
```

No test suite or linter configured.

## Architecture

Hand-rolled router (`usePath()` in `App.jsx`, History API + `popstate` — ponytail-noted, add `react-router-dom` if more pages show up). `App.jsx` owns top-level auth/profile state and redirects based on it:

- No token (`utils/auth.js`, `localStorage`) → `/login` (`pages/AuthPage.jsx`) — `POST /auth/login` with `{username, password}` checked against the `accounts` collection (backend `accounts_service.py`, bcrypt). No signup; accounts are seeded via `backend/scripts/seed_accounts.py`.
- Token but no saved business profile → `/setup` (`components/OnboardingPortal.jsx`), a multi-step form (business info, hours, connect calendar) collected via `components/business-setup-shared.jsx` fields, saved with `PUT /business/profile`.
- Profile exists → `/calendar` (`pages/DashboardPage.jsx`, calendar view + `components/CalendarPanel.jsx`/`EventForm.jsx`/`CallForm.jsx`/`ActivityLog.jsx`) or `/settings` (`pages/SettingsPage.jsx`, re-run of the onboarding fields plus calendar connect/disconnect via `oauth` endpoints).

`utils/profile.js` wraps `fetchBusinessProfile`/`saveBusinessProfile`. `api.js`'s calendar CRUD calls (`fetchEvents`/`createEvent`/`updateEvent`/`deleteEvent`) hit the dashboard-path backend routes (`/calendar/events`, JWT-scoped, `account`/`provider` query params) — separate from the ElevenLabs webhook-tool routes in `backend/app/routers/tools.py`, which the frontend never calls.

`triggerCall` (`POST /calls/trigger`) is used by `CallForm.jsx` to manually place an outbound test call, same endpoint the backend's reminder-job scheduler calls in-process.
