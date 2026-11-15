import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { turso } from "../src/config/turso.js";

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

const publicDirectory = fileURLToPath(
  new URL("../../public/", import.meta.url),
);

const projectDirectory = fileURLToPath(
  new URL("../uploads/projects/", import.meta.url),
);

const avatarDirectory = fileURLToPath(
  new URL("../uploads/avatars/", import.meta.url),
);

const contentTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const jobs = [];
const files = new Map();
let stage = "initialization";

function localFile(table, value) {
  // Profile photos currently store a filename rather than a URL.
  if (table === "admins" && !/^https?:\/\//i.test(value)) {
    if (!/^[a-f0-9-]{36}\.webp$/i.test(value)) {
      throw new Error("Unexpected avatar filename.");
    }

    return path.join(avatarDirectory, value);
  }

  const url = new URL(value, "http://localhost:5173");

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Unsupported image URL.");
  }

  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  // Existing online images already work without your computer.
  if (!local) return null;

  const pathname = decodeURIComponent(url.pathname);

  const publicImage =
    /^\/Arafat-portfolio\/(project-images|skill-icons|published-images)\/([a-z0-9_-]+\.(?:jpg|jpeg|png|webp|svg))$/i.exec(
      pathname,
    );

  if (publicImage) {
    return path.join(publicDirectory, publicImage[1], publicImage[2]);
  }

  const uploadedProject =
    /^\/api\/uploads\/projects\/([a-f0-9-]{36}\.webp)$/i.exec(pathname);

  if (uploadedProject) {
    return path.join(projectDirectory, uploadedProject[1]);
  }

  throw new Error("Unrecognized local image location.");
}

try {
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
  }

  stage = "reading image references from Turso";

  // Select image fields only: no passwords or session tokens.
  const definitions = [
    { table: "projects", column: "image" },
    { table: "skills", column: "icon" },
    { table: "admins", column: "avatar_file" },
  ];

  for (const { table, column } of definitions) {
    const result = await turso.execute(
      `SELECT id, ${column} AS value FROM ${table} ORDER BY id`,
    );

    for (const row of result.rows) {
      const value = String(row.value || "");

      if (!value) continue;

      stage = `locating image for ${table} #${row.id}`;

      const filename = localFile(table, value);

      if (!filename) continue;

      const extension = path.extname(filename).toLowerCase();
      const contentType = contentTypes[extension];

      if (!contentType) {
        throw new Error("Unsupported image extension.");
      }

      // Read every required file before uploading anything.
      if (!files.has(filename)) {
        files.set(filename, {
          bytes: await readFile(filename),
          extension,
          contentType,
          url: null,
        });
      }

      jobs.push({
        table,
        column,
        id: Number(row.id),
        oldValue: value,
        newValue: null,
        filename,
      });
    }
  }

  if (jobs.length === 0) {
    console.log("No local image references need migration.");
  } else {
    stage = "saving the image-reference backup";

    const backupDirectory = new URL("../backups/", import.meta.url);

    await mkdir(backupDirectory, { recursive: true });

    // The .local suffix is already excluded by your .gitignore.
    const receipt = new URL(
      `image-migration-${Date.now()}.json.local`,
      backupDirectory,
    );

    async function saveReceipt() {
      await writeFile(
        receipt,
        JSON.stringify(
          jobs.map(({ filename, ...reference }) => reference),
          null,
          2,
        ) + "\n",
      );
    }

    await saveReceipt();

    console.log("Image-reference backup:", fileURLToPath(receipt));

    let uploaded = 0;

    for (const [filename, file] of files) {
      stage = `uploading image ${uploaded + 1} of ${files.size}`;

      const blob = await put(
        `migration/${randomUUID()}${file.extension}`,
        file.bytes,
        {
          access: "public",
          token,
          contentType: file.contentType,
          addRandomSuffix: true,
          allowOverwrite: false,
        },
      );

      file.url = blob.url;

      for (const job of jobs) {
        if (job.filename === filename) {
          job.newValue = blob.url;
        }
      }

      // Record uploaded URLs before changing database references.
      await saveReceipt();

      uploaded += 1;
      console.log(`Uploaded ${uploaded}/${files.size} images.`);
    }

    stage = "updating Turso image references";

    // Uploads finish before this short database transaction starts.
    const transaction = await turso.transaction("write");

    try {
      const results = await transaction.batch(
        jobs.map((job) => ({
          sql: `
            UPDATE ${job.table}
            SET ${job.column} = ?
            WHERE id = ? AND ${job.column} = ?
          `,
          args: [job.newValue, job.id, job.oldValue],
        })),
      );

      if (results.some((result) => result.rowsAffected !== 1)) {
        throw new Error("An image reference changed during migration.");
      }

      await transaction.commit();
    } catch (error) {
      if (!transaction.closed) {
        await transaction.rollback();
      }

      throw error;
    } finally {
      transaction.close();
    }

    console.log("Image migration complete.");
    console.log(`Uploaded files: ${files.size}`);
    console.log(`Updated image references: ${jobs.length}`);
    console.log("Original local files and database were preserved.");
  }
} catch (error) {
  console.error("Migration stopped during:", stage);
  console.error("Error type:", error.code || error.name);
  console.error("Keep your backup and send this output before retrying.");

  process.exitCode = 1;
} finally {
  turso.close();
}
