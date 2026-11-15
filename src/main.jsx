import { StrictMode, Suspense, lazy, useEffect, useState } from "react";

import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import PortfolioContentProvider from "./components/PortfolioContent.jsx";

import "./index.css";
import "./styles/Theme.css";
import "./styles/Scrollbar.css";

const Admin = lazy(() => import("./admin/Admin.jsx"));

const PRIVATE_ADMIN_HASH = "#/admin/Arafat1272005*";

function Root() {
  const [showAdmin, setShowAdmin] = useState(
    () => window.location.hash === PRIVATE_ADMIN_HASH,
  );

  useEffect(() => {
    function handleNavigation() {
      const hash = window.location.hash;

      // Redirect the ordinary admin address.
      if (hash !== PRIVATE_ADMIN_HASH && /^#\/?admin(?:[/?]|$)/i.test(hash)) {
        window.history.replaceState(
          window.history.state,
          "",
          `${window.location.pathname}${window.location.search}#head`,
        );

        setShowAdmin(false);
        window.scrollTo({ top: 0, behavior: "auto" });
        return;
      }

      // Show login only at your unlisted address.
      setShowAdmin(hash === PRIVATE_ADMIN_HASH);
    }

    handleNavigation();

    window.addEventListener("hashchange", handleNavigation);

    return () => {
      window.removeEventListener("hashchange", handleNavigation);
    };
  }, []);

  if (showAdmin) {
    return (
      <Suspense fallback={<p role="status">Loading dashboard…</p>}>
        <Admin />
      </Suspense>
    );
  }

  return (
    <PortfolioContentProvider>
      <App />
    </PortfolioContentProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
