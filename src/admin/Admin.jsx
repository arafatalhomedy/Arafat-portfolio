import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./components/AdminLayout";
import ProfileProvider from "./components/ProfileProvider";
import Overview from "./sections/Overview";
import Projects from "./sections/Projects";
import Skills from "./sections/Skills";
import Services from "./sections/Services";
import Profile from "./sections/Profile";
import { apiRequest } from "./api";
import "./styles/Admin.css";
import "./styles/AdminScrollbar.css";
import { notifyPortfolioUpdated } from "../components/PortfolioContent";
import useAdminSession from "./hooks/useAdminSession";
export default function Admin() {
  const { session, setSession, restoring, restoreError, retryRestore } =
    useAdminSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [counts, setCounts] = useState(null);
  const [contentError, setContentError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");
  const handleSessionExpired = useCallback(() => {
    setSession(null);
    setCounts(null);
    setNotice("Your session has expired. Please sign in again.");
  }, [setSession]);

  // Keep the original expiry when restoring a saved session.
  useEffect(() => {
    if (!session) return;

    const remaining = session.expiresAt - Date.now();

    if (remaining <= 0) {
      handleSessionExpired();
      return;
    }

    const timer = window.setTimeout(handleSessionExpired, remaining);

    return () => window.clearTimeout(timer);
  }, [session, handleSessionExpired]);

  useEffect(() => {
    if (!session) return;

    const controller = new AbortController();

    setCounts(null);
    setContentError("");

    async function loadOverview() {
      try {
        const data = await apiRequest("/api/content", {
          signal: controller.signal,
        });

        if (
          !Array.isArray(data.projects) ||
          !Array.isArray(data.skills) ||
          !Array.isArray(data.services)
        ) {
          throw new Error("The server returned invalid portfolio content.");
        }

        if (controller.signal.aborted) return;

        setCounts({
          projects: data.projects.length,
          skills: data.skills.length,
          services: data.services.length,
        });
      } catch (requestError) {
        if (controller.signal.aborted) return;

        setContentError(requestError.message);
      }
    }

    loadOverview();

    return () => controller.abort();
  }, [session, refreshKey]);

  async function handleLogin(event) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: {
          username: username.trim(),
          password,
        },
      });

      if (
        !/^[a-f0-9]{64}$/i.test(data.token || "") ||
        typeof data.admin?.username !== "string" ||
        !Number.isFinite(data.expiresAt) ||
        data.expiresAt <= Date.now()
      ) {
        throw new Error("The server returned an invalid login response.");
      }

      setSession(data);
      setPassword("");
      setShowPassword(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
        token: session.token,
      });

      setNotice("You have signed out.");
    } catch (requestError) {
      setNotice(
        requestError.status === 401
          ? "Your session has ended. Please sign in again."
          : "Signed out on this device. The server could not confirm logout.",
      );
    } finally {
      setSession(null);
      setCounts(null);
      setBusy(false);
    }
  }
  if (restoring || restoreError) {
    return (
      <main className="admin-page admin-login-page">
        <div className="admin-login-wrap">
          <section className="admin-login-card" aria-busy={restoring}>
            <p className="admin-eyebrow">PORTFOLIO ADMIN</p>

            <h1 id="admin-session-title">
              {restoring
                ? "Checking your session…"
                : "Unable to restore your session"}
            </h1>

            {restoring ? (
              <p className="admin-subtitle" role="status">
                Please wait while we verify your sign-in.
              </p>
            ) : (
              <>
                <p className="admin-error" role="alert">
                  {restoreError}
                </p>

                <button
                  className="admin-button"
                  type="button"
                  onClick={retryRestore}
                >
                  Retry connection
                </button>

                <button
                  className="admin-back-link"
                  type="button"
                  onClick={() => setSession(null)}
                >
                  Return to sign in
                </button>
              </>
            )}
          </section>
        </div>
      </main>
    );
  }
  if (!session) {
    return (
      <main className="admin-page admin-login-page">
        <div className="admin-login-wrap">
          <a className="admin-back-link" href="#head">
            ← Back to portfolio
          </a>

          <section
            className="admin-login-card"
            aria-labelledby="admin-login-title"
          >
            <span className="admin-logo" aria-hidden="true">
              AA
            </span>

            <p className="admin-eyebrow">PORTFOLIO ADMIN</p>

            <h1 id="admin-login-title">Welcome back.</h1>

            <p className="admin-subtitle">Sign in to manage your portfolio.</p>

            {notice && (
              <p className="admin-notice" role="status">
                {notice}
              </p>
            )}

            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}

            <form onSubmit={handleLogin} aria-busy={busy}>
              <div className="admin-field">
                <label htmlFor="admin-username">Username</label>

                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={50}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  disabled={busy}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="admin-password">Password</label>

                <div className="admin-password-wrap">
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    maxLength={256}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    disabled={busy}
                    required
                  />

                  <button
                    className="admin-password-toggle"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    disabled={busy}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                className="admin-button admin-login-button"
                type="submit"
                disabled={busy}
              >
                {busy ? "Signing in…" : "Sign in"}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }
  const editorProps = {
    token: session.token,

    onChanged: () => {
      setRefreshKey((value) => value + 1);
      notifyPortfolioUpdated();
    },

    onSessionExpired: handleSessionExpired,
  };

  const dashboardSections = {
    overview: (
      <Overview
        username={session.admin.username}
        counts={counts}
        error={contentError}
        onRefresh={() => setRefreshKey((value) => value + 1)}
        onNavigate={setActiveSection}
      />
    ),

    projects: <Projects {...editorProps} />,

    skills: <Skills {...editorProps} />,

    services: <Services {...editorProps} />,

    profile: (
      <Profile
        onPasswordChanged={() => {
          setSession(null);
          setCounts(null);
          setNotice("Password updated. Please sign in with your new password.");
        }}
      />
    ),
  };

  return (
    <ProfileProvider
      token={session.token}
      onSessionExpired={handleSessionExpired}
    >
      <AdminLayout
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onLogout={handleLogout}
        username={session.admin.username}
        busy={busy}
      >
        {dashboardSections[activeSection] || dashboardSections.overview}
      </AdminLayout>
    </ProfileProvider>
  );
}
