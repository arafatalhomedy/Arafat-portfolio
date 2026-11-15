import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dataDirectory = fileURLToPath(new URL("./data/", import.meta.url));

mkdirSync(dataDirectory, { recursive: true });

const db = new Database(path.join(dataDirectory, "portfolio.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,

    FOREIGN KEY (admin_id)
      REFERENCES admins(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS sessions_expiry
    ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'WEB APPLICATION',
    description TEXT NOT NULL DEFAULT '',

    image TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]'
      CHECK (json_valid(tags) AND json_type(tags) = 'array'),

    github TEXT NOT NULL DEFAULT '',
    live TEXT NOT NULL DEFAULT '',

    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 0
      CHECK (is_published IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT '',

    categories TEXT NOT NULL DEFAULT '[]'
      CHECK (
        json_valid(categories)
        AND json_type(categories) = 'array'
      ),

    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 0
      CHECK (is_published IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'web',

    tags TEXT NOT NULL DEFAULT '[]'
      CHECK (json_valid(tags) AND json_type(tags) = 'array'),

    sort_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 0
      CHECK (is_published IN (0, 1)),

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
// Add profile fields to existing databases.
const adminColumns = new Set(
  db
    .prepare("PRAGMA table_info(admins)")
    .all()
    .map((column) => column.name),
);

if (!adminColumns.has("display_name")) {
  db.exec(`
    ALTER TABLE admins
    ADD COLUMN display_name TEXT NOT NULL DEFAULT ''
  `);
}

if (!adminColumns.has("bio")) {
  db.exec(`
    ALTER TABLE admins
    ADD COLUMN bio TEXT NOT NULL DEFAULT ''
  `);
}

if (!adminColumns.has("avatar_file")) {
  db.exec(`
    ALTER TABLE admins
    ADD COLUMN avatar_file TEXT NOT NULL DEFAULT ''
  `);
}
db.exec(`
  CREATE TABLE IF NOT EXISTS login_attempts (
    username_hash TEXT PRIMARY KEY,
    failures INTEGER NOT NULL DEFAULT 0
      CHECK (failures BETWEEN 0 AND 5),
    blocked_until INTEGER NOT NULL DEFAULT 0
  );
`);
export default db;
