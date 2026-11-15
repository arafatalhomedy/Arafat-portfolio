import { createHash } from "node:crypto";
import db from "../config/database.js";

const lockDuration = 60 * 60 * 1000;

function usernameKey(username) {
  return createHash("sha256")
    .update(username.trim().toLowerCase())
    .digest("hex");
}

export async function getLoginBlock(username, connection = db) {
  const result = await connection.execute({
    sql: `
      SELECT blocked_until
      FROM login_attempts
      WHERE username_hash = ?
    `,
    args: [usernameKey(username)],
  });

  const blockedUntil = Number(result.rows[0]?.blocked_until || 0);

  return blockedUntil > Date.now() ? blockedUntil : 0;
}

export async function recordFailedLogin(username) {
  const now = Date.now();

  // One atomic statement keeps concurrent failures from being lost.
  const result = await db.execute({
    sql: `
      INSERT INTO login_attempts (
        username_hash,
        failures,
        blocked_until
      )
      VALUES (?, 1, 0)

      ON CONFLICT(username_hash) DO UPDATE SET
        failures = CASE
          WHEN login_attempts.blocked_until > ?
            THEN login_attempts.failures
          WHEN login_attempts.blocked_until > 0
            THEN 1
          ELSE MIN(login_attempts.failures + 1, 5)
        END,

        blocked_until = CASE
          WHEN login_attempts.blocked_until > ?
            THEN login_attempts.blocked_until
          WHEN login_attempts.blocked_until > 0
            THEN 0
          WHEN login_attempts.failures >= 4
            THEN ?
          ELSE 0
        END

      RETURNING blocked_until
    `,
    args: [usernameKey(username), now, now, now + lockDuration],
  });

  const blockedUntil = Number(result.rows[0].blocked_until);

  return blockedUntil > now ? blockedUntil : 0;
}

export async function clearFailedLogins(username, connection = db) {
  await connection.execute({
    sql: `
      DELETE FROM login_attempts
      WHERE username_hash = ?
    `,
    args: [usernameKey(username)],
  });
}
