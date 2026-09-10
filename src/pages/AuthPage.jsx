import { useState } from "react";
import { login } from "../api.js";

export default function AuthPage({ onAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { access_token } = await login(username.trim(), password);
      onAuthenticated(access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="onboarding-brand auth-brand">Voice Calendar</span>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to manage your business and calendar connections.</p>

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="modal-btn-primary auth-submit" disabled={submitting}>
          {submitting ? "Please wait…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
