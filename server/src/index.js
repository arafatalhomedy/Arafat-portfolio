import express from "express";

import db from "./config/database.js";
import { configureSecurity } from "./config/security.js";

import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";
import profileRouter from "./routes/profile.routes.js";
import uploadsRouter from "./routes/uploads.routes.js";

const app = express();

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "127.0.0.1";

configureSecurity(app);

app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/profile", profileRouter);
app.use("/api/uploads", uploadsRouter);

const projectsQuery = db.prepare(`
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
`);

const skillsQuery = db.prepare(`
  SELECT
    id,
    title,
    icon,
    label,
    categories
  FROM skills
  WHERE is_published = 1
  ORDER BY sort_order ASC, id ASC
`);

const servicesQuery = db.prepare(`
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
`);

function getProjects() {
  return projectsQuery.all().map((project) => ({
    ...project,
    tags: JSON.parse(project.tags),
    live: project.live || null,
  }));
}

function getSkills() {
  return skillsQuery.all().map((skill) => ({
    ...skill,
    categories: JSON.parse(skill.categories),
  }));
}

function getServices() {
  return servicesQuery.all().map((service) => ({
    ...service,
    tags: JSON.parse(service.tags),
  }));
}

app.get("/api/health", (req, res) => {
  db.prepare("SELECT 1").get();

  res.json({
    status: "ok",
    database: "connected",
  });
});

app.get("/api/projects", (req, res) => {
  res.json(getProjects());
});

app.get("/api/skills", (req, res) => {
  res.json(getSkills());
});

app.get("/api/services", (req, res) => {
  res.json(getServices());
});

app.get("/api/content", (req, res) => {
  res.json({
    projects: getProjects(),
    skills: getSkills(),
    services: getServices(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found.",
  });
});

app.use((error, req, res, next) => {
  console.error(error);

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
