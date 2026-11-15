import { Router } from "express";

import db from "../config/database.js";
import { requireAdmin } from "./auth.routes.js";

const router = Router();

router.use(requireAdmin);

const definitions = {
  projects: {
    jsonFields: ["tags"],
  },
  skills: {
    jsonFields: ["categories"],
  },
  services: {
    jsonFields: ["tags"],
  },
};

class ValidationError extends Error {}

function invalid(message) {
  throw new ValidationError(message);
}

function text(value, name, maxLength, required = false) {
  if (value === undefined || value === null) value = "";

  if (typeof value !== "string") {
    invalid(`${name} must be text.`);
  }

  const result = value.trim();

  if (required && !result) {
    invalid(`${name} is required.`);
  }

  if (result.length > maxLength) {
    invalid(`${name} must be ${maxLength} characters or fewer.`);
  }

  return result;
}

function url(value, name) {
  const result = text(value, name, 2048);

  if (!result) return "";

  let parsed;

  try {
    parsed = new URL(result);
  } catch {
    invalid(`${name} must be a complete URL.`);
  }

  if (!["https:", "http:"].includes(parsed.protocol)) {
    invalid(`${name} must start with https:// or http://.`);
  }

  return result;
}

function stringArray(value, name) {
  if (value === undefined) return [];

  if (!Array.isArray(value) || value.length > 25) {
    invalid(`${name} must be an array with no more than 25 items.`);
  }

  return [...new Set(value.map((item) => text(item, name, 60, true)))];
}

function validateBody(kind, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    invalid("A JSON object is required.");
  }

  const sortOrder = body.sort_order ?? 0;

  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 999999) {
    invalid("Display order must be a whole number between 0 and 999999.");
  }

  const published = body.is_published ?? false;

  if (typeof published !== "boolean") {
    invalid("Published must be true or false.");
  }

  const common = {
    title: text(body.title, "Title", 120, true),
    sort_order: sortOrder,
    is_published: published ? 1 : 0,
  };

  if (kind === "projects") {
    const project = {
      ...common,
      category: text(body.category, "Category", 120) || "WEB APPLICATION",
      description: text(body.description, "Description", 5000, true),
      image: url(body.image, "Image URL"),
      tags: JSON.stringify(stringArray(body.tags, "Technologies")),
      github: url(body.github, "GitHub URL"),
      live: url(body.live, "Live website URL"),
    };

    if (published && !project.image) {
      invalid("Add an image URL before publishing this project.");
    }

    if (published && !project.github && !project.live) {
      invalid("Add a GitHub or live website URL before publishing.");
    }

    return project;
  }

  if (kind === "skills") {
    const categories = stringArray(body.categories, "Categories");

    const allowedCategories = new Set(["Frontend", "Backend", "Languages"]);

    if (categories.some((category) => !allowedCategories.has(category))) {
      invalid("Skill categories must be Frontend, Backend, or Languages.");
    }

    if (published && categories.length === 0) {
      invalid("Choose at least one category before publishing this skill.");
    }

    return {
      ...common,
      icon: url(body.icon, "Icon URL"),
      label: text(body.label, "Label", 100),
      categories: JSON.stringify(categories),
    };
  }

  const icon = text(body.icon, "Icon", 20) || "web";

  if (!["web", "ai"].includes(icon)) {
    invalid("Service icon must be web or ai.");
  }

  return {
    ...common,
    category: text(body.category, "Category", 120),
    description: text(body.description, "Description", 5000, true),
    icon,
    tags: JSON.stringify(stringArray(body.tags, "Tags")),
  };
}

function readId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    invalid("Invalid item ID.");
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id)) {
    invalid("Invalid item ID.");
  }

  return id;
}

function serialize(row, definition) {
  const result = {
    ...row,
    is_published: Boolean(row.is_published),
  };

  for (const field of definition.jsonFields) {
    result[field] = JSON.parse(row[field]);
  }

  return result;
}

// Table names come only from this fixed definitions object.
for (const [kind, definition] of Object.entries(definitions)) {
  const listItems = db.prepare(`
    SELECT *
    FROM ${kind}
    ORDER BY sort_order ASC, id ASC
  `);

  const findItem = db.prepare(`
    SELECT * FROM ${kind} WHERE id = ?
  `);

  const removeItem = db.prepare(`
    DELETE FROM ${kind} WHERE id = ?
  `);

  router.get(`/${kind}`, (req, res) => {
    res.json(listItems.all().map((row) => serialize(row, definition)));
  });

  router.post(`/${kind}`, (req, res) => {
    const values = validateBody(kind, req.body);

    const columns = Object.keys(values);
    const placeholders = columns.map(() => "?").join(", ");

    const result = db
      .prepare(
        `
      INSERT INTO ${kind} (${columns.join(", ")})
      VALUES (${placeholders})
    `,
      )
      .run(...Object.values(values));

    const item = findItem.get(result.lastInsertRowid);

    res.status(201).json(serialize(item, definition));
  });

  router.put(`/${kind}/:id`, (req, res) => {
    const id = readId(req.params.id);
    const values = validateBody(kind, req.body);

    const assignments = Object.keys(values)
      .map((column) => `${column} = ?`)
      .join(", ");

    const result = db
      .prepare(
        `
      UPDATE ${kind}
      SET ${assignments}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(...Object.values(values), id);

    if (!result.changes) {
      return res.status(404).json({
        error: "Item not found.",
      });
    }

    res.json(serialize(findItem.get(id), definition));
  });

  router.delete(`/${kind}/:id`, (req, res) => {
    const id = readId(req.params.id);
    const result = removeItem.run(id);

    if (!result.changes) {
      return res.status(404).json({
        error: "Item not found.",
      });
    }

    res.status(204).end();
  });
}

router.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: error.message,
    });
  }

  next(error);
});

export default router;
