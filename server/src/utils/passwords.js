import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

import { promisify } from "node:util";

const deriveKey = promisify(scrypt);

const options = {
  N: 32768,
  r: 8,
  p: 3,
  maxmem: 64 * 1024 * 1024,
};

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");

  const key = await deriveKey(password, salt, 64, options);

  return `scrypt-v1:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof storedHash !== "string") return false;

  const [version, salt, hash] = storedHash.split(":");

  if (
    version !== "scrypt-v1" ||
    !/^[a-f0-9]{32}$/.test(salt || "") ||
    !/^[a-f0-9]{128}$/.test(hash || "")
  ) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = await deriveKey(password, salt, 64, options);

  return timingSafeEqual(expected, actual);
}
