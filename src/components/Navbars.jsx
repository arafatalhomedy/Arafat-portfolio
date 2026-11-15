import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ProfilePhoto from "./ProfilePhoto";
import "../styles/Navbar.css";

const links = [
  { label: "Projects", href: "#projects", icon: "projects" },
  { label: "Services", href: "#services", icon: "services" },
  { label: "Skills", href: "#skills", icon: "skills" },
  { label: "Contact", href: "#connect", icon: "contact" },
];

const iconPaths = {
  projects: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  services:
    "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M3 7h18v14H3z M3 12h18 M10 12v3h4v-3",
  skills: "m8 5-7 7 7 7 m8-14 7 7-7 7 m-3-17-2 20",
  contact: "M3 5h18v14H3z M3 6l9 7 9-7",
  arrow: "M5 12h14 m-6-6 6 6-6 6",
  moon: "M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z",
  sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 2v2 m0 16v2 M2 12h2 m16 0h2 M5 5l1.5 1.5 m11 11L19 19 M5 19l1.5-1.5 m11-11L19 5",
};

function Icon({ name }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function NavigationLinks({ onNavigate }) {
  return links.map((link) => (
    <a key={link.href} href={link.href} onClick={onNavigate}>
      <Icon name={link.icon} />
      <span>{link.label}</span>
    </a>
  ));
}

export default function Navbars({ theme, setTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const headerRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");

    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const desktop = window.matchMedia("(min-width: 768px)");

    const handleScreenChange = () => {
      if (desktop.matches) setMenuOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    document.addEventListener("keydown", handleEscape);
    desktop.addEventListener("change", handleScreenChange);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);
      desktop.removeEventListener("change", handleScreenChange);
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} className="portfolio-navbar">
      <ProfilePhoto />

      <nav className="portfolio-nav-links" aria-label="Main navigation">
        <NavigationLinks />
      </nav>

      <div className="portfolio-nav-actions">
        <button
          type="button"
          className="portfolio-theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>

        <a href="#connect" className="portfolio-contact-button">
          <span>Let’s talk</span>
          <Icon name="arrow" />
        </a>

        <button
          ref={menuButtonRef}
          type="button"
          className="portfolio-menu-toggle"
          data-open={menuOpen}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.nav
            id={menuId}
            className="portfolio-mobile-menu"
            aria-label="Mobile navigation"
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: reduceMotion ? 0 : -8,
            }}
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <p className="portfolio-menu-label">EXPLORE</p>

            <div className="portfolio-mobile-links">
              <NavigationLinks onNavigate={() => setMenuOpen(false)} />
            </div>

            <div className="portfolio-menu-footer">
              <a
                href="#connect"
                className="portfolio-contact-button"
                onClick={() => setMenuOpen(false)}
              >
                <span>Let’s talk</span>
                <Icon name="arrow" />
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
