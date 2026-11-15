import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { createHash, randomBytes } from "node:crypto";

import db from "../config/database.js";
import { getLoginBlock, recordFailedLogin } from "../utils/login-attempts.js";
import { hashPassword, verifyPassword } from "../utils/passwords.js";

const router = Router();
const sessionDuration = 60 * 60 * 1000;

// Unknown usernames still go through password verification.
const dummyPasswordHash = await hashPassword(randomBytes(32).toString("hex"));

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sendBlocked(res, blockedUntil) {
  const seconds = Math.max(1, Math.ceil((blockedUntil - Date.now()) / 1000));

  const minutes = Math.ceil(seconds / 60);

  res.set("Retry-After", String(seconds));

  return res.status(429).json({
    error:
      "Login is locked after too many incorrect attempts. " +
      `Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
  });
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many login requests. Please try again later.",
  },
});

export async function requireAdmin(req, res, next) {
  res.set("Cache-Control", "no-store");

  const authorization = req.get("Authorization") || "";
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(authorization);

  if (!match) {
    return res.status(401).json({
      error: "Please sign in.",
    });
  }

  const tokenHash = sha256(match[1]);

  const result = await db.execute({
    sql: `
      SELECT
        admins.id,
        admins.username
      FROM sessions
      JOIN admins ON admins.id = sessions.admin_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > ?
    `,
    args: [tokenHash, Date.now()],
  });

  const session = result.rows[0];

  if (!session) {
    return res.status(401).json({
      error: "Your session has expired. Please sign in again.",
    });
  }

  req.admin = {
    id: Number(session.id),
    username: session.username,
  };

  req.sessionTokenHash = tokenHash;

  next();
}

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    !username.trim() ||
    username.length > 50 ||
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 256
  ) {
    return res.status(400).json({
      error: "Enter a valid username and password.",
    });
  }

  const normalizedUsername = username.trim().toLowerCase();

  const existingBlock = await getLoginBlock(normalizedUsername);

  if (existingBlock) {
    return sendBlocked(res, existingBlock);
  }

  const result = await db.execute({
    sql: `
      SELECT id, username, password_hash
      FROM admins
      WHERE username = ?
    `,
    args: [normalizedUsername],
  });

  const admin = result.rows[0];

  // Password verification happens outside the database transaction.
  const validPassword = await verifyPassword(
    password,
    admin?.password_hash || dummyPasswordHash,
  );

  if (!admin || !validPassword) {
    const blockedUntil = await recordFailedLogin(normalizedUsername);

    if (blockedUntil) {
      return sendBlocked(res, blockedUntil);
    }

    return res.status(401).json({
      error: "Incorrect username or password.",
    });
  }

  const token = randomBytes(32).toString("hex");
  const usernameHash = sha256(normalizedUsername);

  let signedInAdmin;
  let expiresAt;

  // Recheck the password hash and lock before creating a session.
  const transaction = await db.transaction("write");

  try {
    const freshResult = await transaction.execute({
      sql: `
        SELECT
          admins.id,
          admins.username,
          admins.password_hash,
          COALESCE(login_attempts.blocked_until, 0) AS blocked_until
        FROM admins
        LEFT JOIN login_attempts
          ON login_attempts.username_hash = ?
        WHERE admins.id = ?
      `,
      args: [usernameHash, admin.id],
    });

    const freshAdmin = freshResult.rows[0];
    const blockedUntil = Number(freshAdmin?.blocked_until || 0);

    if (blockedUntil > Date.now()) {
      await transaction.rollback();
      return sendBlocked(res, blockedUntil);
    }

    if (
      !freshAdmin ||
      freshAdmin.username !== normalizedUsername ||
      freshAdmin.password_hash !== admin.password_hash
    ) {
      await transaction.rollback();

      return res.status(401).json({
        error: "Incorrect username or password.",
      });
    }

    const now = Date.now();
    expiresAt = now + sessionDuration;

    await transaction.batch([
      {
        sql: `
          DELETE FROM login_attempts
          WHERE username_hash = ?
        `,
        args: [usernameHash],
      },
      {
        sql: `
          DELETE FROM sessions
          WHERE expires_at <= ?
        `,
        args: [now],
      },
      {
        sql: `
          INSERT INTO sessions (
            token_hash,
            admin_id,
            expires_at
          )
          VALUES (?, ?, ?)
        `,
        args: [sha256(token), freshAdmin.id, expiresAt],
      },
    ]);

    await transaction.commit();

    signedInAdmin = {
      id: Number(freshAdmin.id),
      username: freshAdmin.username,
    };
  } catch (error) {
    if (!transaction.closed) {
      await transaction.rollback();
    }

    throw error;
  } finally {
    transaction.close();
  }

  res.json({
    token,
    expiresAt,
    admin: signedInAdmin,
  });
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({
    admin: req.admin,
  });
});

router.post("/logout", requireAdmin, async (req, res) => {
  await db.execute({
    sql: `
      DELETE FROM sessions
      WHERE token_hash = ?
    `,
    args: [req.sessionTokenHash],
  });

  res.status(204).end();
});

export default router;
