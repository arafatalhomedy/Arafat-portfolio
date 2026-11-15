import { createHash } from "node:crypto";
import db from "../config/database.js";

const findAttempt = db.prepare(`
  SELECT failures, blocked_until
  FROM login_attempts
  WHERE username_hash = ?
`);

const saveAttempt = db.prepare(`
  INSERT INTO login_attempts (
    username_hash,
    failures,
    blocked_until
  )
  VALUES (?, ?, ?)
  ON CONFLICT(username_hash) DO UPDATE SET
    failures = excluded.failures,
    blocked_until = excluded.blocked_until
`);

const removeAttempt = db.prepare(`
  DELETE FROM login_attempts
  WHERE username_hash = ?
`);

function usernameKey(username) {
  return createHash("sha256")
    .update(username.trim().toLowerCase())
    .digest("hex");
}

export function getLoginBlock(username) {
  const row = findAttempt.get(usernameKey(username));

  return row?.blocked_until > Date.now() ? row.blocked_until : 0;
}

export const recordFailedLogin = db.transaction((username) => {
  const key = usernameKey(username);
  const now = Date.now();
  const previous = findAttempt.get(key);

  // Attempts during the lock do not extend it.
  if (previous?.blocked_until > now) {
    return previous.blocked_until;
  }

  // Start fresh after an expired lock.
  const failures = previous?.blocked_until ? 1 : (previous?.failures || 0) + 1;

  const blockedUntil = failures >= 5 ? now + 60 * 60 * 1000 : 0;

  saveAttempt.run(key, failures, blockedUntil);

  return blockedUntil;
});

export function clearFailedLogins(username) {
  removeAttempt.run(usernameKey(username));
}
