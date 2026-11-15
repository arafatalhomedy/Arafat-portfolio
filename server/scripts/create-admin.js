import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { stdin, stdout } from "node:process";

import db from "../src/config/database.js";
import { hashPassword } from "../src/utils/passwords.js";

let muted = false;

const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) {
      stdout.write(chunk, encoding);
    }

    callback();
  },
});

const terminal = createInterface({
  input: stdin,
  output,
  terminal: true,
});

async function askPassword(label) {
  stdout.write(label);
  muted = true;

  try {
    return await terminal.question("");
  } finally {
    muted = false;
    stdout.write("\n");
  }
}

try {
  const existingAdmin = db.prepare("SELECT id FROM admins LIMIT 1").get();

  if (existingAdmin) {
    throw new Error("An admin account already exists.");
  }

  const username = (await terminal.question("Choose a username: "))
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    throw new Error(
      "Use 3–50 characters: letters, numbers, dots, underscores, or hyphens.",
    );
  }

  const password = await askPassword("Choose a password: ");
  const confirmation = await askPassword("Confirm password: ");

  if (password.length < 12 || password.length > 256) {
    throw new Error("Use a password between 12 and 256 characters.");
  }

  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  const passwordHash = await hashPassword(password);

  db.prepare(
    `
    INSERT INTO admins (username, password_hash)
    VALUES (?, ?)
  `,
  ).run(username, passwordHash);

  console.log(`\nAdmin account "${username}" created.`);
} catch (error) {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
} finally {
  terminal.close();
  db.close();
}
