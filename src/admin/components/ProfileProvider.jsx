import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "../api";
import { notifyPortfolioUpdated } from "../../components/PortfolioContent";
const ProfileContext = createContext(null);

export function profileInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return parts[0]?.slice(0, 2).toUpperCase() || "AA";
}

export function useAdminProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("Admin profile components must be inside ProfileProvider.");
  }

  return context;
}

export default function ProfileProvider({ token, onSessionExpired, children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarRevision, setAvatarRevision] = useState(0);

  const request = useCallback(
    async (path, options = {}) => {
      try {
        return await apiRequest(path, {
          ...options,
          token,
        });
      } catch (requestError) {
        if (requestError.status === 401) {
          onSessionExpired();
        }

        throw requestError;
      }
    },
    [token, onSessionExpired],
  );

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    async function loadProfile() {
      try {
        const data = await request("/api/profile", {
          signal: controller.signal,
        });

        if (!data.profile || typeof data.profile.username !== "string") {
          throw new Error("The server returned an invalid profile.");
        }

        if (controller.signal.aborted) return;

        setProfile(data.profile);
      } catch (requestError) {
        if (controller.signal.aborted) return;

        setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, [request, revision]);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";

    setAvatarUrl("");
    setAvatarError("");

    if (!profile?.has_avatar) {
      setAvatarLoading(false);
      return () => controller.abort();
    }

    setAvatarLoading(true);

    async function loadAvatar() {
      try {
        const image = await request("/api/profile/avatar", {
          responseType: "blob",
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        objectUrl = URL.createObjectURL(image);
        setAvatarUrl(objectUrl);
      } catch (requestError) {
        if (controller.signal.aborted) return;

        setAvatarError(requestError.message);
      } finally {
        if (!controller.signal.aborted) {
          setAvatarLoading(false);
        }
      }
    }

    loadAvatar();

    return () => {
      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [request, profile?.has_avatar, avatarRevision]);

  function applyProfile(updatedProfile, photoChanged = false) {
    setProfile(updatedProfile);

    if (photoChanged) {
      setAvatarRevision((value) => value + 1);
      notifyPortfolioUpdated();
    }
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        avatarUrl,
        avatarLoading,
        avatarError,
        request,
        applyProfile,
        reload: () => setRevision((value) => value + 1),
        reloadAvatar: () => setAvatarRevision((value) => value + 1),
        expireSession: onSessionExpired,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
