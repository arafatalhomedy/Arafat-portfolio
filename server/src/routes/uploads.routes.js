import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";

import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { requireAdmin } from "./auth.routes.js";

const router = Router();

const directory = fileURLToPath(
  new URL("../../uploads/projects/", import.meta.url),
);

mkdirSync(directory, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 2,
  },

  fileFilter(req, file, callback) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      const error = new Error("Choose a JPG, PNG, or WebP image.");
      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many uploads. Please try again later.",
  },
});

/* Portfolio visitors can view uploaded screenshots. */
router.get("/projects/:filename", (req, res, next) => {
  const { filename } = req.params;

  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/i.test(
      filename,
    )
  ) {
    return res.status(404).end();
  }

  res.set("X-Content-Type-Options", "nosniff");

  res.sendFile(
    path.join(directory, filename),
    {
      maxAge: "1y",
      immutable: true,
    },
    (error) => {
      if (!error) return;

      if (error.code === "ENOENT" && !res.headersSent) {
        return res.status(404).end();
      }

      next(error);
    },
  );
});

/* Only the signed-in administrator can upload. */
router.post(
  "/project-image",
  requireAdmin,
  uploadLimiter,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "Choose an image first.",
      });
    }

    let buffer;

    try {
      const image = sharp(req.file.buffer, {
        limitInputPixels: 25_000_000,
      });

      const metadata = await image.metadata();

      if (
        !["jpeg", "png", "webp"].includes(metadata.format) ||
        (metadata.pages || 1) > 1
      ) {
        return res.status(400).json({
          error: "Choose a still JPG, PNG, or WebP image.",
        });
      }

      buffer = await image
        .rotate()
        .resize({
          width: 1920,
          height: 4096,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 88 })
        .toBuffer();
    } catch {
      return res.status(400).json({
        error: "This image cannot be processed. Try another image.",
      });
    }

    const filename = `${randomUUID()}.webp`;

    await writeFile(path.join(directory, filename), buffer, {
      flag: "wx",
    });

    res.status(201).json({
      path: `/api/uploads/projects/${filename}`,
    });
  },
);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "The image must be smaller than 10 MB."
          : "Upload one image at a time.",
    });
  }

  if (error.status === 400) {
    return res.status(400).json({
      error: error.message,
    });
  }

  next(error);
});

export default router;
