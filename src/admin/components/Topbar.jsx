import "../styles/AdminLayout.css";
import { profileInitials, useAdminProfile } from "./ProfileProvider";
export default function Topbar({
  title = "Overview",
  username = "Administrator",
  onMenuClick,
  onProfileClick,
  menuId,
  menuOpen = false,
}) {
  const { profile, avatarUrl } = useAdminProfile();

  const accountName = profile?.display_name || username;
  const initials = profileInitials(accountName);

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar-start">
        <button
          type="button"
          className="dashboard-mobile-toggle"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls={menuId}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="dashboard-page-heading">
          <p className="dashboard-breadcrumb">WORKSPACE</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="dashboard-topbar-actions">
        <button
          type="button"
          className="dashboard-profile-button"
          onClick={onProfileClick}
          aria-label={`Open profile for ${accountName}`}
        >
          <span className="dashboard-profile-avatar" aria-hidden="true">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
          </span>

          <span className="dashboard-profile-details">
            <span className="dashboard-profile-name">{accountName}</span>

            <span className="dashboard-profile-role">Administrator</span>
          </span>

          <svg
            className="dashboard-profile-chevron"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
