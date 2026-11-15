import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

export function configureSecurity(app) {
  const production = process.env.NODE_ENV === "production";

  const allowedOrigins = new Set([
    "https://arafatalhomedy.github.io",

    ...(!production
      ? [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:4173",
          "http://127.0.0.1:4173",
        ]
      : []),
  ]);

  app.disable("x-powered-by");

  app.use(
    helmet({
      // Public screenshots and your avatar appear on another origin.
      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },

      // This Express server serves API responses and images.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'none'"],
        },
      },

      xFrameOptions: {
        action: "deny",
      },

      referrerPolicy: {
        policy: "no-referrer",
      },

      strictTransportSecurity: production
        ? {
            maxAge: 31536000,
            includeSubDomains: false,
          }
        : false,
    }),
  );

  // Reject browser requests from unapproved origins.
  // Authentication still protects requests without an Origin header.
  app.use((req, res, next) => {
    const origin = req.get("Origin");

    if (origin && !allowedOrigins.has(origin)) {
      return res.status(403).json({
        error: "This origin is not allowed.",
      });
    }

    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        callback(null, !origin || allowedOrigins.has(origin));
      },

      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false,
      maxAge: 600,
    }),
  );

  app.use(
    "/api",
    rateLimit({
      windowMs: 5 * 60 * 1000,
      limit: 600,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: "Too many requests. Please try again later.",
      },
    }),
  );
}