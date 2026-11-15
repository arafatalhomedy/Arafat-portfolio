import Database from "better-sqlite3";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { turso } from "../src/config/turso.js";

const tables = [
  "admins",
  "sessions",
  "projects",
  "skills",
  "services",
  "login_attempts",
];

function quote(name) {
  return '"' + name.replaceAll('"', '""') + '"';
}

let local;

try {
  // This matches the location in your current database.js.
  const localPath = fileURLToPath(
    new URL("../src/config/data/portfolio.db", import.meta.url),
  );

  local = new Database(localPath, {
    readonly: true,
    fileMustExist: true,
  });

  // Refuse to overwrite an existing portfolio database.
  const existing = await turso.execute({
    sql: `
      SELECT name
      FROM sqlite_schema
      WHERE type = 'table'
        AND name IN (${tables.map(() => "?").join(", ")})
    `,
    args: tables,
  });

  if (existing.rows.length > 0) {
    throw new Error(
      "Turso already contains portfolio tables. Migration stopped to protect existing data.",
    );
  }

  // Make a consistent local backup.
  const backupDirectory = new URL("../backups/", import.meta.url);

  await mkdir(backupDirectory, { recursive: true });

  const backupPath = fileURLToPath(
    new URL("portfolio-before-turso-" + Date.now() + ".db", backupDirectory),
  );

  await local.backup(backupPath);

  console.log("Local backup saved:", backupPath);

  // Read the source in one consistent transaction.
  const migration = local.transaction(() => {
    const statements = [];
    const counts = {};

    // Copy table definitions.
    for (const table of tables) {
      const definition = local
        .prepare(
          `
          SELECT sql
          FROM sqlite_schema
          WHERE type = 'table' AND name = ?
        `,
        )
        .get(table);

      if (!definition?.sql) {
        throw new Error("Missing local table: " + table);
      }

      statements.push({
        sql: definition.sql.replace(/\bIF\s+NOT\s+EXISTS\b/gi, ""),
        args: [],
      });
    }

    // Copy content, account details, and login-lock records.
    for (const table of tables) {
      counts[table] = 0;

      // Online devices will sign in with fresh sessions.
      if (table === "sessions") continue;

      const columns = local
        .prepare(`PRAGMA table_info(${quote(table)})`)
        .all()
        .map((column) => column.name);

      const rows = local.prepare(`SELECT * FROM ${quote(table)}`).all();

      counts[table] = rows.length;

      const sql = `
        INSERT INTO ${quote(table)}
          (${columns.map(quote).join(", ")})
        VALUES
          (${columns.map(() => "?").join(", ")})
      `;

      for (const row of rows) {
        statements.push({
          sql,
          args: columns.map((column) => row[column]),
        });
      }
    }

    // Copy explicitly created indexes.
    const indexes = local
      .prepare(
        `
        SELECT sql
        FROM sqlite_schema
        WHERE type = 'index'
          AND sql IS NOT NULL
          AND tbl_name IN (${tables.map(() => "?").join(", ")})
      `,
      )
      .all(...tables);

    for (const index of indexes) {
      statements.push({
        sql: index.sql,
        args: [],
      });
    }

    return { statements, counts };
  })();

  if (migration.counts.admins === 0) {
    throw new Error(
      "No local admin account was found. Check the database location.",
    );
  }

  // All transfer statements commit together or roll back together.
  await turso.batch(migration.statements, "write");

  const results = await turso.batch(
    tables.map((table) => ({
      sql: `SELECT COUNT(*) AS total FROM ${quote(table)}`,
      args: [],
    })),
    "read",
  );

  const report = tables.map((table, index) => {
    const actual = Number(results[index].rows[0].total);

    if (actual !== migration.counts[table]) {
      throw new Error("Row count does not match for: " + table);
    }

    return {
      Table: table,
      Rows: actual,
    };
  });

  console.table(report);
  console.log("Database transfer complete.");
} catch (error) {
  console.error("Migration stopped:", error.code || error.message);

  process.exitCode = 1;
} finally {
  local?.close();
  turso.close();
}
