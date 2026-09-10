import { useState } from "react";
import { signup, login } from "../api.js";

export default function AuthPage({ onAuthenticated }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { access_token } = isSignup
        ? await signup(email.trim(), password)
        : await login(email.trim(), password);
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
        <h1 className="auth-title">{isSignup ? "Create your business account" : "Welcome back"}</h1>
        <p className="auth-subtitle">
          {isSignup
            ? "Sign up to connect your calendar and start taking calls."
            : "Log in to manage your business and calendar connections."}
        </p>

        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@business.com"
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
            placeholder={isSignup ? "At least 8 characters" : "••••••••"}
            minLength={isSignup ? 8 : undefined}
            required
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="modal-btn-primary auth-submit" disabled={submitting}>
          {submitting ? "Please wait…" : isSignup ? "Create account" : "Log in"}
        </button>

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => {
              setError(null);
              setIsSignup((s) => !s);
            }}
          >
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </form>
    </div>
  );
}
