import express from "express";

import db from "./config/database.js";
import { configureSecurity } from "./config/security.js";

import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";
import profileRouter from "./routes/profile.routes.js";
import uploadsRouter from "./routes/uploads.routes.js";

const app = express();

configureSecurity(app);

app.use(express.json({ limit: "100kb" }));

app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/profile", profileRouter);
app.use("/api/uploads", uploadsRouter);

const projectsQuery = `
  SELECT
    id,
    title,
    category,
    description,
    image,
    tags,
    github,
    live
  FROM projects
  WHERE is_published = 1
  ORDER BY sort_order ASC, id ASC
`;

const skillsQuery = `
  SELECT
    id,
    title,
    icon,
    label,
    categories
  FROM skills
  WHERE is_published = 1
  ORDER BY sort_order ASC, id ASC
`;

const servicesQuery = `
  SELECT
    id,
    title,
    category,
    description,
    icon,
    tags
  FROM services
  WHERE is_published = 1
  ORDER BY sort_order ASC, id ASC
`;

const avatarQuery = `
  SELECT avatar_file
  FROM admins
  ORDER BY id ASC
  LIMIT 1
`;

function serializeProjects(rows) {
  return rows.map((project) => ({
    ...project,
    tags: JSON.parse(project.tags),
    live: project.live || null,
  }));
}

function serializeSkills(rows) {
  return rows.map((skill) => ({
    ...skill,
    categories: JSON.parse(skill.categories),
  }));
}

function serializeServices(rows) {
  return rows.map((service) => ({
    ...service,
    tags: JSON.parse(service.tags),
  }));
}

app.get("/api/health", async (req, res) => {
  await db.execute("SELECT 1");

  res.json({
    status: "ok",
    database: "connected",
  });
});

app.get("/api/projects", async (req, res) => {
  const result = await db.execute(projectsQuery);

  res.json(serializeProjects(result.rows));
});

app.get("/api/skills", async (req, res) => {
  const result = await db.execute(skillsQuery);

  res.json(serializeSkills(result.rows));
});

app.get("/api/services", async (req, res) => {
  const result = await db.execute(servicesQuery);

  res.json(serializeServices(result.rows));
});

app.get("/api/content", async (req, res) => {
  const results = await db.batch(
    [projectsQuery, skillsQuery, servicesQuery, avatarQuery],
    "read",
  );

  res.json({
    projects: serializeProjects(results[0].rows),
    skills: serializeSkills(results[1].rows),
    services: serializeServices(results[2].rows),
    avatar: results[3].rows[0]?.avatar_file || "",
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found.",
  });
});

app.use((error, req, res, next) => {
  // Avoid logging request bodies, passwords, or authorization headers.
  console.error("API request failed:", error.code || error.name || "Error");

  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "Invalid JSON.",
    });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request body is too large.",
    });
  }

  res.status(500).json({
    error: "Something went wrong on the server.",
  });
});

// Vercel runs the exported application.
// Local development starts its own HTTP server.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || "127.0.0.1";

  const server = app.listen(port, host, () => {
    console.log(`Portfolio API running at http://${host}:${port}`);
  });

  function shutdown() {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  }

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

export default app;
