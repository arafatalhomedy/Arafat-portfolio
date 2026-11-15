import "../styles/AdminLayout.css";
import "../styles/Sidebar.css";
import "../styles/Topbar.css";

const menuItems = [
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "projects", label: "Projects", icon: "projects" },
  { id: "skills", label: "Skills", icon: "skills" },
  { id: "services", label: "Services", icon: "services" },
];

const iconPaths = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",

  projects:
    "M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z",

  skills: "m8 5-7 7 7 7 m8-14 7 7-7 7 m-3-17-2 20",

  services:
    "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M3 7h18v14H3z M3 12h18 M10 12v3h4v-3",

  profile:
    "M16 7a4 4 0 1 1-8 0a4 4 0 0 1 8 0 M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2",

  external:
    "M14 3h7v7 M21 3 10 14 M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5",

  logout: "M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4 M10 12h11 m-4-4 4 4-4 4",
};

function SidebarIcon({ name }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

export default function Sidebar({
  activeSection,
  onNavigate,
  onLogout,
  busy = false,
}) {
  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-body">
        <p className="dashboard-menu-heading">WORKSPACE</p>

        <nav className="dashboard-menu" aria-label="Dashboard sections">
          {menuItems.map((item) => {
            const active = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className="dashboard-menu-item"
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate(item.id)}
                disabled={busy}
              >
                <span className="dashboard-menu-icon">
                  <SidebarIcon name={item.icon} />
                </span>

                <span>{item.label}</span>

                {active && (
                  <span
                    className="dashboard-menu-indicator"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="dashboard-sidebar-shortcuts">
          <p className="dashboard-menu-heading">QUICK ACCESS</p>

          <a
            className="dashboard-menu-item"
            href={`${import.meta.env.BASE_URL}#head`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="dashboard-menu-icon">
              <SidebarIcon name="external" />
            </span>

            <span>View portfolio</span>

            <span className="dashboard-shortcut-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      </div>

      <footer className="dashboard-sidebar-footer">
        <button
          className="dashboard-signout"
          type="button"
          onClick={onLogout}
          disabled={busy}
        >
          <SidebarIcon name="logout" />
          <span>{busy ? "Signing out…" : "Sign out"}</span>
        </button>
      </footer>
    </aside>
  );
}
