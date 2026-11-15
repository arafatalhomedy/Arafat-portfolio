import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import multer from "multer";
import sharp from "sharp";

import { requireAdmin } from "./auth.routes.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 4 * 1024 * 1024,
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
  keyGenerator: (req) => String(req.admin.id),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many uploads. Please try again later.",
  },
});

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

    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

    if (!token) {
      throw new Error("Blob storage is not configured.");
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
        error:
          "This image cannot be processed. Use a valid image under 25 megapixels.",
      });
    }

    const blob = await put(`projects/${randomUUID()}.webp`, buffer, {
      token,
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
      allowOverwrite: false,
    });

    // The existing frontend helper also accepts an absolute URL.
    res.status(201).json({
      path: blob.url,
    });
  },
);

router.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "The image must be 4 MB or smaller."
          : "Upload one image using the image field.",
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
