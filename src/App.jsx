import { useEffect, useState, useCallback } from "react";
import AuthPage from "./pages/AuthPage.jsx";
import OnboardingPortal from "./components/OnboardingPortal.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { getProfile, saveProfile } from "./utils/profile.js";
import { getToken, setToken, clearToken } from "./utils/auth.js";
import { fetchMe } from "./api.js";

// ponytail: hand-rolled History API router — add react-router-dom if more pages show up.
function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to) => {
    window.history.pushState({}, "", to);
    setPath(to);
  }, []);

  return [path, navigate];
}

export default function App() {
  const [path, navigate] = usePath();
  const [account, setAccount] = useState(undefined); // undefined = checking, null = signed out
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = none saved

  useEffect(() => {
    if (!getToken()) {
      setAccount(null);
      return;
    }
    fetchMe()
      .then(setAccount)
      .catch(() => {
        clearToken();
        setAccount(null);
      });
  }, []);

  useEffect(() => {
    if (!account) return;
    getProfile().then(setProfile).catch(() => setProfile(null));
  }, [account]);

  useEffect(() => {
    if (account === undefined) return;
    if (!account && path !== "/login") navigate("/login");
  }, [account, path, navigate]);

  useEffect(() => {
    if (!account || profile === undefined) return;
    if (!profile && path !== "/setup") navigate("/setup");
    else if (profile && (path === "/" || path === "" || path === "/login")) navigate("/calendar");
  }, [account, profile, path, navigate]);

  function handleAuthenticated(token) {
    setToken(token);
    fetchMe().then(setAccount);
  }

  function handleLogout() {
    clearToken();
    setAccount(null);
    setProfile(undefined);
    navigate("/login");
  }

  if (account === undefined) {
    return <div className="app-loading">Loading…</div>;
  }

  if (!account || path === "/login") {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  if (profile === undefined) {
    return <div className="app-loading">Loading…</div>;
  }

  if (!profile || path === "/setup") {
    return (
      <OnboardingPortal
        onFinish={async (p) => {
          const saved = await saveProfile(p);
          setProfile(saved);
          navigate("/calendar");
        }}
      />
    );
  }

  if (path === "/settings") {
    return (
      <SettingsPage
        profile={profile}
        onSave={(p) => setProfile(p)}
        onBack={() => navigate("/calendar")}
      />
    );
  }

  return <DashboardPage profile={profile} onOpenSetup={() => navigate("/settings")} onLogout={handleLogout} />;
}
