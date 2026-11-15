import { useEffect, useId, useRef, useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "../styles/AdminLayout.css";

const sectionTitles = {
  overview: "Overview",
  projects: "Projects",
  skills: "Skills",
  services: "Services",
  profile: "Profile",
};

export default function AdminLayout({
  activeSection = "overview",
  onNavigate,
  onLogout,
  username,
  busy = false,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const dialogRef = useRef(null);
  const contentRef = useRef(null);

  const menuId = useId();
  const title = sectionTitles[activeSection] || "Overview";

  function openMenu() {
    const dialog = dialogRef.current;

    if (!dialog || dialog.open) return;

    dialog.showModal();
    setMenuOpen(true);
  }

  function closeMenu() {
    dialogRef.current?.close();
  }

  function navigate(section) {
    closeMenu();
    onNavigate(section);
  }

  function handleBackdropClick(event) {
    if (event.target !== event.currentTarget) return;

    const bounds = event.currentTarget.getBoundingClientRect();

    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) closeMenu();
  }

  // Prevent the background from scrolling while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  // Close the mobile menu when switching to desktop.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");

    function handleScreenChange() {
      if (desktop.matches) {
        dialogRef.current?.close();
      }
    }

    desktop.addEventListener("change", handleScreenChange);

    return () => {
      desktop.removeEventListener("change", handleScreenChange);
    };
  }, []);

  // Move keyboard focus to the selected section.
  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true });
  }, [activeSection]);

  return (
    <div className="admin-page dashboard-layout">
      <div className="dashboard-desktop-sidebar">
        <Sidebar
          activeSection={activeSection}
          onNavigate={navigate}
          onLogout={onLogout}
          username={username}
          busy={busy}
        />
      </div>

      <dialog
        ref={dialogRef}
        id={menuId}
        className="dashboard-mobile-menu"
        aria-labelledby={`${menuId}-title`}
        onClose={() => setMenuOpen(false)}
        onClick={handleBackdropClick}
      >
        <div className="dashboard-mobile-menu-header">
          <span id={`${menuId}-title`}>Navigation</span>

          <button
            type="button"
            className="dashboard-menu-close"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <Sidebar
          activeSection={activeSection}
          onNavigate={navigate}
          onLogout={onLogout}
          username={username}
          busy={busy}
        />
      </dialog>

      <div className="dashboard-workspace">
        <Topbar
          title={title}
          username={username}
          onMenuClick={openMenu}
          onProfileClick={() => navigate("profile")}
          menuId={menuId}
          menuOpen={menuOpen}
        />

        <main
          ref={contentRef}
          className="dashboard-content"
          aria-label={`${title} content`}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
