import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { put, del } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import multer from "multer";
import sharp from "sharp";

import db from "../config/database.js";
import { requireAdmin } from "./auth.routes.js";
import { hashPassword, verifyPassword } from "../utils/passwords.js";

const router = Router();

// This is the public hostname from your completed image migration.
const blobOrigin = "https://9sh62rxuqjnzelvg.public.blob.vercel-storage.com";

class ProfileError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function requireBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ProfileError("A JSON object is required.");
  }

  return body;
}

function blobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (!token) {
    throw new Error("Blob storage is not configured.");
  }

  return token;
}

function avatarUrl(value) {
  const url = new URL(value);

  if (
    url.origin !== blobOrigin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/(?:avatars|migration)\/[a-z0-9-]+\.webp$/i.test(url.pathname)
  ) {
    throw new Error("Invalid stored profile photo URL.");
  }

  return url.href;
}

async function removeAvatar(value) {
  if (!value) return;

  try {
    await del(avatarUrl(value), {
      token: blobToken(),
    });
  } catch (error) {
    // A cleanup failure must not undo a saved profile update.
    console.error("Old photo cleanup failed:", error.name);
  }
}

async function sendAvatar(res, value) {
  const response = await fetch(avatarUrl(value), {
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });

  if (response.status === 404) {
    throw new ProfileError("Profile photo not found.", 404);
  }

  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/webp")
  ) {
    throw new Error("Profile photo could not be loaded.");
  }

  const image = Buffer.from(await response.arrayBuffer());

  res.set("X-Content-Type-Options", "nosniff");
  res.type("image/webp").send(image);
}

async function getProfile(adminId) {
  const result = await db.execute({
    sql: `
      SELECT
        admins.id,
        admins.username,
        admins.display_name,
        admins.bio,
        admins.avatar_file,
        admins.created_at,
        (
          SELECT COUNT(*)
          FROM sessions
          WHERE sessions.admin_id = admins.id
            AND sessions.expires_at > ?
        ) AS active_sessions
      FROM admins
      WHERE admins.id = ?
    `,
    args: [Date.now(), adminId],
  });

  const admin = result.rows[0];

  if (!admin) {
    throw new ProfileError("Account not found.", 404);
  }

  return {
    id: Number(admin.id),
    username: admin.username,
    display_name: admin.display_name,
    bio: admin.bio,
    has_avatar: Boolean(admin.avatar_file),
    created_at: admin.created_at,
    active_sessions: Number(admin.active_sessions),
  };
}

async function replaceAvatar(adminId, nextUrl) {
  const transaction = await db.transaction("write");

  try {
    const results = await transaction.batch([
      {
        sql: "SELECT avatar_file FROM admins WHERE id = ?",
        args: [adminId],
      },
      {
        sql: "UPDATE admins SET avatar_file = ? WHERE id = ?",
        args: [nextUrl, adminId],
      },
    ]);

    if (!results[0].rows[0] || results[1].rowsAffected !== 1) {
      throw new ProfileError("Account not found.", 404);
    }

    await transaction.commit();

    return results[0].rows[0].avatar_file;
  } catch (error) {
    if (!transaction.closed) {
      await transaction.rollback();
    }

    throw error;
  } finally {
    transaction.close();
  }
}

// Public photo for the portfolio.
router.get("/public-avatar", async (req, res) => {
  const result = await db.execute(`
    SELECT avatar_file
    FROM admins
    ORDER BY id ASC
    LIMIT 1
  `);

  const photo = result.rows[0]?.avatar_file;

  if (!photo) {
    return res.status(404).end();
  }

  await sendAvatar(res, photo);
});

// Everything below requires a valid admin session.
router.use(requireAdmin);

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

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 2,
  },

  fileFilter(req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new ProfileError("Choose a JPG, PNG, or WebP image."));
    }

    callback(null, true);
  },
});

router.get("/", async (req, res) => {
  res.json({
    profile: await getProfile(req.admin.id),
  });
});

router.put("/", async (req, res) => {
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

  const result = await db.execute({
    sql: `
      UPDATE admins
      SET display_name = ?, bio = ?
      WHERE id = ?
    `,
    args: [displayName, bio, req.admin.id],
  });

  if (result.rowsAffected !== 1) {
    throw new ProfileError("Account not found.", 404);
  }

  res.json({
    profile: await getProfile(req.admin.id),
  });
});

router.get("/avatar", async (req, res) => {
  const result = await db.execute({
    sql: "SELECT avatar_file FROM admins WHERE id = ?",
    args: [req.admin.id],
  });

  const photo = result.rows[0]?.avatar_file;

  if (!photo) {
    throw new ProfileError("No profile photo has been uploaded.", 404);
  }

  await sendAvatar(res, photo);
});

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
        "Use a valid, non-animated JPG, PNG, or WebP image under 25 megapixels.",
      );
    }

    const blob = await put(`avatars/${randomUUID()}.webp`, image, {
      token: blobToken(),
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
      allowOverwrite: false,
    });

    // Check that the configured token belongs to your image store.
    const nextUrl = avatarUrl(blob.url);

    const previousAvatar = await replaceAvatar(req.admin.id, nextUrl);

    await removeAvatar(previousAvatar);

    res.json({
      profile: await getProfile(req.admin.id),
    });
  },
);

router.delete("/avatar", async (req, res) => {
  const previousAvatar = await replaceAvatar(req.admin.id, "");

  await removeAvatar(previousAvatar);

  res.json({
    profile: await getProfile(req.admin.id),
  });
});

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

  const result = await db.execute({
    sql: "SELECT password_hash FROM admins WHERE id = ?",
    args: [req.admin.id],
  });

  const admin = result.rows[0];

  if (!admin) {
    throw new ProfileError("Account not found.", 404);
  }

  const correct = await verifyPassword(currentPassword, admin.password_hash);

  if (!correct) {
    throw new ProfileError("Your current password is incorrect.");
  }

  // Keep expensive hashing outside the database transaction.
  const newHash = await hashPassword(newPassword);

  const transaction = await db.transaction("write");

  try {
    const updated = await transaction.execute({
      sql: `
        UPDATE admins
        SET password_hash = ?
        WHERE id = ? AND password_hash = ?
      `,
      args: [newHash, req.admin.id, admin.password_hash],
    });

    if (updated.rowsAffected !== 1) {
      throw new ProfileError(
        "Your password changed during this request. Please sign in again.",
        409,
      );
    }

    await transaction.execute({
      sql: "DELETE FROM sessions WHERE admin_id = ?",
      args: [req.admin.id],
    });

    await transaction.commit();
  } catch (error) {
    if (!transaction.closed) {
      await transaction.rollback();
    }

    throw error;
  } finally {
    transaction.close();
  }

  res.json({
    message: "Password changed. Please sign in again.",
  });
});

router.post("/sessions/revoke-others", async (req, res) => {
  const result = await db.execute({
    sql: `
      DELETE FROM sessions
      WHERE admin_id = ?
        AND token_hash <> ?
        AND expires_at > ?
    `,
    args: [req.admin.id, req.sessionTokenHash, Date.now()],
  });

  res.json({
    revoked: result.rowsAffected,
    profile: await getProfile(req.admin.id),
  });
});

router.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "Choose an image that is 4 MB or smaller."
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
