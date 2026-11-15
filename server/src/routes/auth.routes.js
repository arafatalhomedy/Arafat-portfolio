import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { createHash, randomBytes } from "node:crypto";
import {
  getLoginBlock,
  recordFailedLogin,
  clearFailedLogins,
} from "../utils/login-attempts.js";
import db from "../config/database.js";
import { hashPassword, verifyPassword } from "../utils/passwords.js";
const router = Router();

const sessionDuration = 60 * 60 * 1000;

const dummyPasswordHash = await hashPassword(randomBytes(32).toString("hex"));

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

const findAdmin = db.prepare(`
  SELECT id, username, password_hash
  FROM admins
  WHERE username = ?
`);

const findSession = db.prepare(`
  SELECT
    sessions.token_hash,
    sessions.expires_at,
    admins.id,
    admins.username
  FROM sessions
  JOIN admins ON admins.id = sessions.admin_id
  WHERE sessions.token_hash = ?
    AND sessions.expires_at > ?
`);

const createSession = db.prepare(`
  INSERT INTO sessions (token_hash, admin_id, expires_at)
  VALUES (?, ?, ?)
`);

const deleteSession = db.prepare(`
  DELETE FROM sessions WHERE token_hash = ?
`);

const clearExpiredSessions = db.prepare(`
  DELETE FROM sessions WHERE expires_at <= ?
`);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many login requests. Please try again later.",
  },
});

export function requireAdmin(req, res, next) {
  res.set("Cache-Control", "no-store");

  const authorization = req.get("Authorization") || "";
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(authorization);

  if (!match) {
    return res.status(401).json({
      error: "Please sign in.",
    });
  }

  const tokenHash = hashToken(match[1]);
  const session = findSession.get(tokenHash, Date.now());

  if (!session) {
    return res.status(401).json({
      error: "Your session has expired. Please sign in again.",
    });
  }

  req.admin = {
    id: session.id,
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

  function sendBlocked(blockedUntil) {
    const seconds = Math.max(1, Math.ceil((blockedUntil - Date.now()) / 1000));

    const minutes = Math.ceil(seconds / 60);

    res.set("Retry-After", String(seconds));

    return res.status(429).json({
      error:
        `Login is locked after too many incorrect attempts. ` +
        `Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    });
  }

  const existingBlock = getLoginBlock(normalizedUsername);

  if (existingBlock) {
    return sendBlocked(existingBlock);
  }

  const admin = findAdmin.get(normalizedUsername);

  const validPassword = await verifyPassword(
    password,
    admin?.password_hash || dummyPasswordHash,
  );

  if (
    !admin ||
    !validPassword ||
    findAdmin.get(normalizedUsername)?.password_hash !== admin.password_hash
  ) {
    const blockedUntil = recordFailedLogin(normalizedUsername);

    if (blockedUntil) {
      return sendBlocked(blockedUntil);
    }

    return res.status(401).json({
      error: "Incorrect username or password.",
    });
  }

  // Another request may have triggered a lock during verification.
  const latestBlock = getLoginBlock(normalizedUsername);

  if (latestBlock) {
    return sendBlocked(latestBlock);
  }

  clearFailedLogins(normalizedUsername);

  const now = Date.now();
  const expiresAt = now + sessionDuration;
  const token = randomBytes(32).toString("hex");

  clearExpiredSessions.run(now);
  createSession.run(hashToken(token), admin.id, expiresAt);

  res.json({
    token,
    expiresAt,
    admin: {
      id: admin.id,
      username: admin.username,
    },
  });
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({
    admin: req.admin,
  });
});

router.post("/logout", requireAdmin, (req, res) => {
  deleteSession.run(req.sessionTokenHash);
  res.status(204).end();
});

export default router;
