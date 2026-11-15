import { useEffect, useRef, useState } from "react";

import {
  profileInitials,
  useAdminProfile,
} from "../components/ProfileProvider";

import "../styles/Profile.css";

function PasswordField({
  label,
  name,
  value,
  onChange,
  visible,
  isNew = false,
}) {
  return (
    <label className="profile-field">
      <span>{label}</span>

      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        autoComplete={isNew ? "new-password" : "current-password"}
        minLength={isNew ? 12 : undefined}
        maxLength={256}
        required
      />
    </label>
  );
}

function formatJoinedDate(value) {
  if (!value) return "—";

  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;

  const date = new Date(normalized);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export default function Profile({ onPasswordChanged }) {
  const {
    profile,
    loading,
    error,
    avatarUrl,
    avatarLoading,
    avatarError,
    request,
    applyProfile,
    reload,
    reloadAvatar,
    expireSession,
  } = useAdminProfile();

  const [details, setDetails] = useState({
    display_name: "",
    bio: "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [operation, setOperation] = useState("");
  const [feedback, setFeedback] = useState(null);

  const fileRef = useRef(null);
  const feedbackRef = useRef(null);

  useEffect(() => {
    if (!profile) return;

    setDetails({
      display_name: profile.display_name || profile.username,
      bio: profile.bio || "",
    });
  }, [profile?.id, profile?.display_name, profile?.bio]);

  const detailsDirty =
    Boolean(profile) &&
    (details.display_name !== (profile.display_name || profile.username) ||
      details.bio !== (profile.bio || ""));

  const hasUnsavedChanges =
    detailsDirty || Object.values(passwords).some(Boolean);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function warnBeforeLeaving(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);

    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
    };
  }, [hasUnsavedChanges]);

  function report(kind, text) {
    setFeedback({ kind, text });

    window.requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({
        block: "nearest",
      });
    });
  }

  async function perform(name, action) {
    if (operation || loading) return;

    setOperation(name);
    setFeedback(null);

    try {
      await action();
    } catch (requestError) {
      if (requestError.status !== 401) {
        report("error", requestError.message);
      }
    } finally {
      setOperation("");
    }
  }

  function saveDetails(event) {
    event.preventDefault();

    perform("details", async () => {
      const data = await request("/api/profile", {
        method: "PUT",
        body: {
          display_name: details.display_name.trim(),
          bio: details.bio.trim(),
        },
      });

      applyProfile(data.profile);

      setDetails({
        display_name: data.profile.display_name || data.profile.username,
        bio: data.profile.bio || "",
      });

      report("success", "Your profile has been updated.");
    });
  }

  function uploadPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      report("error", "Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      report("error", "Choose an image that is 4 MB or smaller.");
      return;
    }

    perform("photo", async () => {
      const body = new FormData();
      body.append("avatar", file);

      const data = await request("/api/profile/avatar", {
        method: "POST",
        body,
      });

      applyProfile(data.profile, true);
      report("success", "Your profile photo has been updated.");
    });
  }

  function removePhoto() {
    if (!window.confirm("Remove your profile photo?")) return;

    perform("photo", async () => {
      const data = await request("/api/profile/avatar", {
        method: "DELETE",
      });

      applyProfile(data.profile, true);
      report("success", "Your profile photo has been removed.");
    });
  }

  function updatePasswordField(name, value) {
    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function changePassword(event) {
    event.preventDefault();

    if (passwords.new_password !== passwords.confirm_password) {
      report("error", "The new passwords do not match.");
      return;
    }

    if (passwords.current_password === passwords.new_password) {
      report("error", "Choose a password different from your current one.");
      return;
    }

    perform("password", async () => {
      await request("/api/profile/password", {
        method: "POST",
        body: passwords,
      });

      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      if (onPasswordChanged) {
        onPasswordChanged();
      } else {
        expireSession();
      }
    });
  }

  function revokeOtherSessions() {
    if (
      !window.confirm(
        "Sign out all other sessions? You will stay signed in here.",
      )
    ) {
      return;
    }

    perform("sessions", async () => {
      const data = await request("/api/profile/sessions/revoke-others", {
        method: "POST",
      });

      applyProfile(data.profile);

      report(
        "success",
        data.revoked
          ? `Signed out ${data.revoked} other session${data.revoked === 1 ? "" : "s"}.`
          : "There were no other active sessions.",
      );
    });
  }

  if (!profile) {
    return (
      <section className="profile-settings">
        <div className="profile-state-card">
          <h2>{loading ? "Loading your profile…" : "Profile unavailable"}</h2>

          {error && <p role="alert">{error}</p>}

          {!loading && (
            <button
              className="profile-secondary"
              type="button"
              onClick={reload}
            >
              Try again
            </button>
          )}
        </div>
      </section>
    );
  }

  const busy = Boolean(operation) || loading;
  const displayName = profile.display_name || profile.username;

  return (
    <section className="profile-settings">
      <div className="profile-settings-heading">
        <div>
          <p className="profile-settings-eyebrow">YOUR ACCOUNT</p>
          <h2>Profile settings.</h2>
          <p className="profile-settings-description">
            Personalize your workspace and manage account security.
          </p>
        </div>

        <button
          className="profile-secondary"
          type="button"
          disabled={busy}
          onClick={() => {
            if (
              detailsDirty &&
              !window.confirm("Refresh and discard unsaved profile details?")
            ) {
              return;
            }

            reload();
          }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="profile-feedback" data-kind="error" role="alert">
          {error}
        </p>
      )}

      {feedback && (
        <p
          ref={feedbackRef}
          className="profile-feedback"
          data-kind={feedback.kind}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </p>
      )}

      <div className="profile-identity-card">
        <span className="profile-settings-avatar" aria-hidden="true">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            profileInitials(displayName)
          )}
        </span>

        <div className="profile-identity-details">
          <span className="profile-role-badge">Administrator</span>
          <h3>{displayName}</h3>
          <p>@{profile.username}</p>
        </div>

        <div className="profile-photo-controls">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadPhoto}
            disabled={busy}
            hidden
            aria-label="Choose a profile photo"
          />

          <div className="profile-photo-buttons">
            <button
              className="profile-primary"
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              {operation === "photo"
                ? "Updating photo…"
                : profile.has_avatar
                  ? "Change photo"
                  : "Upload photo"}
            </button>

            {profile.has_avatar && (
              <button
                className="profile-secondary"
                type="button"
                onClick={removePhoto}
                disabled={busy}
              >
                Remove
              </button>
            )}
          </div>

          <p className="profile-hint">
            {avatarLoading
              ? "Loading your photo…"
              : "JPG, PNG or WebP. Up to 4 MB."}
          </p>

          {avatarError && (
            <button
              className="profile-photo-retry"
              type="button"
              onClick={reloadAvatar}
              disabled={busy || avatarLoading}
            >
              Photo unavailable. Retry
            </button>
          )}
        </div>
      </div>

      <div className="profile-settings-grid">
        <form
          className="profile-settings-card"
          onSubmit={saveDetails}
          aria-busy={operation === "details"}
        >
          <div className="profile-card-heading">
            <span className="profile-card-symbol" aria-hidden="true">
              ◇
            </span>

            <div>
              <h3>Personal details</h3>
              <p>Your name and a short introduction.</p>
            </div>
          </div>

          <fieldset disabled={busy}>
            <label className="profile-field">
              <span>Display name</span>

              <input
                name="display_name"
                autoComplete="name"
                value={details.display_name}
                onChange={(event) =>
                  setDetails((current) => ({
                    ...current,
                    display_name: event.target.value,
                  }))
                }
                maxLength={120}
                required
              />
            </label>

            <label className="profile-field">
              <span>Login username</span>
              <input value={profile.username} readOnly />
            </label>

            <p className="profile-hint">
              Your display name does not change your login username.
            </p>

            <label className="profile-field">
              <span>Short bio</span>

              <textarea
                name="bio"
                value={details.bio}
                onChange={(event) =>
                  setDetails((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
                maxLength={500}
                rows={5}
                placeholder="Write a short introduction about yourself."
                aria-describedby="profile-bio-count"
              />
            </label>

            <p className="profile-character-count" id="profile-bio-count">
              {details.bio.length} / 500
            </p>

            <div className="profile-form-footer">
              <span className="profile-hint">
                {detailsDirty
                  ? "You have unsaved changes."
                  : "Details are up to date."}
              </span>

              <button
                className="profile-primary"
                type="submit"
                disabled={!detailsDirty}
              >
                {operation === "details" ? "Saving…" : "Save changes"}
              </button>
            </div>
          </fieldset>
        </form>

        <div className="profile-security-stack">
          <form
            className="profile-settings-card"
            onSubmit={changePassword}
            aria-busy={operation === "password"}
          >
            <div className="profile-card-heading">
              <span className="profile-card-symbol" aria-hidden="true">
                ⌁
              </span>

              <div>
                <h3>Password & security</h3>
                <p>Keep access to your account secure.</p>
              </div>
            </div>

            <fieldset disabled={busy}>
              <PasswordField
                label="Current password"
                name="current_password"
                value={passwords.current_password}
                onChange={updatePasswordField}
                visible={showPasswords}
              />

              <PasswordField
                label="New password"
                name="new_password"
                value={passwords.new_password}
                onChange={updatePasswordField}
                visible={showPasswords}
                isNew
              />

              <PasswordField
                label="Confirm new password"
                name="confirm_password"
                value={passwords.confirm_password}
                onChange={updatePasswordField}
                visible={showPasswords}
                isNew
              />

              <label className="profile-show-passwords">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(event) => setShowPasswords(event.target.checked)}
                />
                Show passwords
              </label>

              <p className="profile-security-note">
                Use 12–256 characters. Changing your password signs out every
                session, including this one.
              </p>

              <button className="profile-primary" type="submit">
                {operation === "password"
                  ? "Updating password…"
                  : "Update password"}
              </button>
            </fieldset>
          </form>

          <div className="profile-settings-card">
            <div className="profile-card-heading">
              <span className="profile-card-symbol" aria-hidden="true">
                ↗
              </span>

              <div>
                <h3>Account activity</h3>
                <p>Review your current sign-ins.</p>
              </div>
            </div>

            <dl className="profile-account-facts">
              <div>
                <dt>Active sessions</dt>
                <dd>{profile.active_sessions}</dd>
              </div>

              <div>
                <dt>Account created</dt>
                <dd>{formatJoinedDate(profile.created_at)}</dd>
              </div>
            </dl>

            <button
              className="profile-secondary"
              type="button"
              onClick={revokeOtherSessions}
              disabled={busy || profile.active_sessions <= 1}
            >
              {operation === "sessions"
                ? "Signing out…"
                : "Sign out other sessions"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
