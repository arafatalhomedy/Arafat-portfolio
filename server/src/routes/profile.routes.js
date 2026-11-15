import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";

import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import db from "../config/database.js";
import { requireAdmin } from "./auth.routes.js";
import { hashPassword, verifyPassword } from "../utils/passwords.js";

const router = Router();
/* Public photo used by the portfolio navbar */
router.get("/public-avatar", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("X-Content-Type-Options", "nosniff");

  // This portfolio has one owner account.
  const owner = db
    .prepare(
      `
    SELECT avatar_file
    FROM admins
    ORDER BY id ASC
    LIMIT 1
  `,
    )
    .get();

  if (!owner?.avatar_file) {
    return res.status(404).end();
  }

  res.sendFile(
    avatarPath(owner.avatar_file),
    {
      cacheControl: false,
      lastModified: false,
    },
    (error) => {
      if (!error) return;

      if (error.code === "ENOENT" && !res.headersSent) {
        return res.status(404).end();
      }

      next(error);
    },
  );
});
router.use(requireAdmin);

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

class ProfileError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/* Private avatar storage */
const avatarDirectory = fileURLToPath(
  new URL("../../uploads/avatars/", import.meta.url),
);

mkdirSync(avatarDirectory, { recursive: true });

function avatarPath(filename) {
  if (!/^[a-f0-9-]{36}\.webp$/i.test(filename)) {
    throw new Error("Invalid stored avatar filename.");
  }

  return path.join(avatarDirectory, filename);
}

async function removeAvatarFile(filename) {
  if (!filename) return;

  try {
    await unlink(avatarPath(filename));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Avatar cleanup failed:", error);
    }
  }
}

/* Database queries */
const findProfile = db.prepare(`
  SELECT
    id,
    username,
    display_name,
    bio,
    avatar_file,
    created_at
  FROM admins
  WHERE id = ?
`);

const countSessions = db.prepare(`
  SELECT COUNT(*) AS total
  FROM sessions
  WHERE admin_id = ?
    AND expires_at > ?
`);

const updateProfile = db.prepare(`
  UPDATE admins
  SET display_name = ?, bio = ?
  WHERE id = ?
`);

const updateAvatar = db.prepare(`
  UPDATE admins
  SET avatar_file = ?
  WHERE id = ?
`);

const findPassword = db.prepare(`
  SELECT password_hash
  FROM admins
  WHERE id = ?
`);

const updatePassword = db.prepare(`
  UPDATE admins
  SET password_hash = ?
  WHERE id = ?
    AND password_hash = ?
`);

const removeAllSessions = db.prepare(`
  DELETE FROM sessions
  WHERE admin_id = ?
`);

const removeOtherSessions = db.prepare(`
  DELETE FROM sessions
  WHERE admin_id = ?
    AND token_hash <> ?
    AND expires_at > ?
`);

function getProfile(adminId) {
  const admin = findProfile.get(adminId);

  if (!admin) {
    throw new ProfileError("Account not found.", 404);
  }

  return {
    id: admin.id,
    username: admin.username,
    display_name: admin.display_name,
    bio: admin.bio,
    has_avatar: Boolean(admin.avatar_file),
    created_at: admin.created_at,
    active_sessions: countSessions.get(adminId, Date.now()).total,
  };
}

function requireBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ProfileError("A JSON object is required.");
  }

  return body;
}

/* Rate limits */
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => String(req.admin.id),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many password attempts. Try again in 15 minutes.",
  },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.admin.id),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many photo uploads. Try again later.",
  },
});

/* Photo upload configuration */
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1,
  },

  fileFilter(req, file, callback) {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!allowedTypes.has(file.mimetype)) {
      return callback(new ProfileError("Choose a JPG, PNG, or WebP image."));
    }

    callback(null, true);
  },
});

/* Read profile */
router.get("/", (req, res) => {
  res.json({
    profile: getProfile(req.admin.id),
  });
});

/* Update display name and bio */
router.put("/", (req, res) => {
  const body = requireBody(req.body);

  if (typeof body.display_name !== "string" || typeof body.bio !== "string") {
    throw new ProfileError("Enter a display name and bio.");
  }

  const displayName = body.display_name.trim();
  const bio = body.bio.trim();

  if (!displayName || displayName.length > 120) {
    throw new ProfileError(
      "Display name must be between 1 and 120 characters.",
    );
  }

  if (bio.length > 500) {
    throw new ProfileError("Bio must be 500 characters or fewer.");
  }

  updateProfile.run(displayName, bio, req.admin.id);

  res.json({
    profile: getProfile(req.admin.id),
  });
});

/* Read the current profile photo */
router.get("/avatar", (req, res, next) => {
  const admin = findProfile.get(req.admin.id);

  if (!admin?.avatar_file) {
    return res.status(404).json({
      error: "No profile photo has been uploaded.",
    });
  }

  res.set("X-Content-Type-Options", "nosniff");

  res.sendFile(
    avatarPath(admin.avatar_file),
    {
      cacheControl: false,
      lastModified: false,
    },
    (error) => {
      if (!error) return;

      if (error.code === "ENOENT" && !res.headersSent) {
        return res.status(404).type("json").json({
          error: "Profile photo not found.",
        });
      }

      next(error);
    },
  );
});

/* Upload or replace a profile photo */
router.post(
  "/avatar",
  uploadLimiter,
  upload.single("avatar"),
  async (req, res) => {
    if (!req.file) {
      throw new ProfileError("Choose a profile photo.");
    }

    let image;

    try {
      const processor = sharp(req.file.buffer, {
        limitInputPixels: 25_000_000,
      });

      const metadata = await processor.metadata();

      if (
        !["jpeg", "png", "webp"].includes(metadata.format) ||
        (metadata.pages || 1) > 1
      ) {
        throw new Error("Unsupported image.");
      }

      image = await processor
        .rotate()
        .resize(512, 512, { fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new ProfileError(
        "Use a valid, non-animated JPG, PNG, or WebP image under 5 MB and 25 megapixels.",
      );
    }

    const filename = `${randomUUID()}.webp`;

    await writeFile(avatarPath(filename), image, {
      flag: "wx",
    });

    let previousAvatar;

    try {
      previousAvatar = db.transaction(() => {
        const admin = findProfile.get(req.admin.id);

        if (!admin) {
          throw new ProfileError("Account not found.", 404);
        }

        updateAvatar.run(filename, req.admin.id);

        return admin.avatar_file;
      })();
    } catch (error) {
      await removeAvatarFile(filename);
      throw error;
    }

    await removeAvatarFile(previousAvatar);

    res.json({
      profile: getProfile(req.admin.id),
    });
  },
);

/* Remove the current profile photo */
router.delete("/avatar", async (req, res) => {
  const previousAvatar = db.transaction(() => {
    const admin = findProfile.get(req.admin.id);

    if (!admin) {
      throw new ProfileError("Account not found.", 404);
    }

    updateAvatar.run("", req.admin.id);

    return admin.avatar_file;
  })();

  await removeAvatarFile(previousAvatar);

  res.json({
    profile: getProfile(req.admin.id),
  });
});

/* Change password and invalidate all existing sessions */
router.post("/password", passwordLimiter, async (req, res) => {
  const body = requireBody(req.body);

  const {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmation,
  } = body;

  if (
    typeof currentPassword !== "string" ||
    currentPassword.length === 0 ||
    currentPassword.length > 256
  ) {
    throw new ProfileError("Enter your current password.");
  }

  if (
    typeof newPassword !== "string" ||
    newPassword.length < 12 ||
    newPassword.length > 256
  ) {
    throw new ProfileError("Your new password must contain 12–256 characters.");
  }

  if (newPassword !== confirmation) {
    throw new ProfileError("The new passwords do not match.");
  }

  if (newPassword === currentPassword) {
    throw new ProfileError(
      "Choose a password different from your current one.",
    );
  }

  const admin = findPassword.get(req.admin.id);

  if (!admin) {
    throw new ProfileError("Account not found.", 404);
  }

  const correctPassword = await verifyPassword(
    currentPassword,
    admin.password_hash,
  );

  if (!correctPassword) {
    throw new ProfileError("Your current password is incorrect.");
  }

  const newHash = await hashPassword(newPassword);

  db.transaction(() => {
    const result = updatePassword.run(
      newHash,
      req.admin.id,
      admin.password_hash,
    );

    if (!result.changes) {
      throw new ProfileError(
        "Your password changed during this request. Please sign in again.",
        409,
      );
    }

    removeAllSessions.run(req.admin.id);
  })();

  res.json({
    message: "Password changed. Please sign in again.",
  });
});

/* Keep this session and sign out other active sessions */
router.post("/sessions/revoke-others", (req, res) => {
  const result = removeOtherSessions.run(
    req.admin.id,
    req.sessionTokenHash,
    Date.now(),
  );

  res.json({
    revoked: result.changes,
    profile: getProfile(req.admin.id),
  });
});

/* Profile and upload errors */
router.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "Choose an image smaller than 5 MB."
          : "Upload one image using the avatar field.",
    });
  }

  if (error instanceof ProfileError) {
    return res.status(error.status).json({
      error: error.message,
    });
  }

  next(error);
});

export default router;
