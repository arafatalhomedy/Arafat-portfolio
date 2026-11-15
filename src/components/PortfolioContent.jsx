import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import "../styles/PortfolioContent.css";

const ContentContext = createContext(null);

const updateEvent = "portfolio-content-updated";

const apiUrl = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:3001" : "")
).replace(/\/+$/, "");

const emptyContent = {
  projects: [],
  skills: [],
  services: [],
  avatar: "",
};

function addDisplayNumbers(items) {
  return items.map((item, index) => ({
    ...item,
    display_number: String(index + 1).padStart(2, "0"),
  }));
}
function resolveImage(value) {
  if (!value) return "";

  try {
    const url = new URL(
      value,
      window.location.origin + import.meta.env.BASE_URL,
    );

    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
export function notifyPortfolioUpdated() {
  window.dispatchEvent(new Event(updateEvent));

  try {
    localStorage.setItem(updateEvent, `${Date.now()}-${Math.random()}`);
  } catch {
    // Refreshing or returning to the portfolio tab still reloads content.
  }
}

export function usePortfolioContent() {
  const context = useContext(ContentContext);

  if (!context) {
    throw new Error(
      "Portfolio sections must be inside PortfolioContentProvider.",
    );
  }

  return context;
}

export default function PortfolioContentProvider({ children }) {
  const [content, setContent] = useState(emptyContent);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    async function loadContent() {
      try {
        const contentUrl = apiUrl
          ? apiUrl + "/api/content"
          : import.meta.env.BASE_URL + "portfolio-content.json";

        const response = await fetch(contentUrl, {
          signal: controller.signal,
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Portfolio content request failed (${response.status}).`,
          );
        }

        const data = await response.json();

        if (
          !Array.isArray(data.projects) ||
          !Array.isArray(data.skills) ||
          !Array.isArray(data.services)
        ) {
          throw new Error("Invalid portfolio content response.");
        }

        if (controller.signal.aborted) return;

        setContent({
          projects: addDisplayNumbers(
            data.projects.map((item) => ({
              ...item,
              image: resolveImage(item.image),
            })),
          ),

          skills: data.skills.map((item) => ({
            ...item,
            icon: resolveImage(item.icon),
          })),

          services: addDisplayNumbers(data.services),
          avatar: resolveImage(data.avatar),
        });
      } catch (requestError) {
        if (controller.signal.aborted) return;

        console.error("Portfolio content:", requestError);

        setError("Unable to load this section. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadContent();

    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    function handleFocus() {
      if (document.visibilityState === "visible") {
        reload();
      }
    }

    function handleStorage(event) {
      if (event.key === updateEvent) {
        reload();
      }
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(updateEvent, reload);

    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(updateEvent, reload);

      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [reload]);

  return (
    <ContentContext.Provider
      value={{
        ...content,
        loading,
        error,
        reload,

        avatarUrl: apiUrl
          ? `${apiUrl}/api/profile/public-avatar?v=${revision}`
          : content.avatar,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function PortfolioContentStatus({
  id,
  title,
  loading,
  error,
  onRetry,
  emptyMessage,
}) {
  return (
    <section id={id} className="portfolio-data-section" aria-busy={loading}>
      <div className="portfolio-data-container">
        <h2>{title}</h2>

        <div className="portfolio-data-message">
          <p role={error ? "alert" : "status"}>
            {loading ? "Loading…" : error || emptyMessage}
          </p>

          {error && !loading && (
            <button type="button" onClick={onRetry}>
              Try again
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
