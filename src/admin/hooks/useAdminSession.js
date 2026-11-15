import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api";

const storageKey = `portfolio-admin-session:${import.meta.env.BASE_URL}`;

function removeStoredSession() {
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // Browser settings may disable storage.
  }
}

function readStoredSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));

    if (
      !saved ||
      !/^[a-f0-9]{64}$/i.test(saved.token || "") ||
      !Number.isFinite(saved.expiresAt) ||
      saved.expiresAt <= Date.now()
    ) {
      removeStoredSession();
      return null;
    }

    return saved;
  } catch {
    removeStoredSession();
    return null;
  }
}

export default function useAdminSession() {
  const [session, setSessionState] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState("");
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  const setSession = useCallback((nextSession) => {
    if (nextSession) {
      // Store only the temporary token, expiry, and account identity.
      const saved = {
        token: nextSession.token,
        expiresAt: nextSession.expiresAt,
        admin: nextSession.admin,
      };

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(saved));
      } catch {
        // Sign-in still works in memory if storage is unavailable.
      }
    } else {
      removeStoredSession();
    }

    setSessionState(nextSession);
    setRestoreError("");
    setRestoring(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const saved = readStoredSession();

    setRestoreError("");

    if (!saved) {
      setRestoring(false);
      return () => controller.abort();
    }

    setRestoring(true);

    async function restoreSession() {
      try {
        const data = await apiRequest("/api/auth/me", {
          token: saved.token,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (
          !Number.isSafeInteger(data.admin?.id) ||
          typeof data.admin?.username !== "string"
        ) {
          throw new Error("The server returned an invalid session.");
        }

        if (saved.expiresAt <= Date.now()) {
          setSession(null);
          return;
        }

        // Use the identity confirmed by the backend.
        setSession({
          token: saved.token,
          expiresAt: saved.expiresAt,
          admin: data.admin,
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        if (error.status === 401) {
          setSession(null);
        } else {
          // Keep the saved token so a connection failure can be retried.
          setRestoreError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setRestoring(false);
        }
      }
    }

    restoreSession();

    return () => controller.abort();
  }, [restoreAttempt, setSession]);

  const retryRestore = useCallback(() => {
    setRestoreAttempt((value) => value + 1);
  }, []);

  return {
    session,
    setSession,
    restoring,
    restoreError,
    retryRestore,
  };
}
