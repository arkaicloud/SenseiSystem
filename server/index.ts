// Load environment variables first before any other imports
import "./env";

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDefaultAdmin } from "./auth";
import crypto from "crypto";
import { buildSafeMetadata, initializeSystemLogs, systemLogger } from "./services/systemLogger";

const app = express();

// Trust the Replit proxy (and any reverse proxy in front of Express)
// Required for express-rate-limit to correctly read X-Forwarded-For
app.set('trust proxy', 1);

// CORS — only allow same origin (the app is self-hosted, no cross-origin API use)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// Security headers (helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to not break Vite/React in dev
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiter for authentication endpoints (login, forgot password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for registration (public endpoint)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: "Limite de cadastros atingido. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: "Muitas solicitações de redefinição. Tente novamente em 1 hora." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters to sensitive public endpoints
app.use("/api/login", authLimiter);
app.use("/api/auth/forgot-password", passwordResetLimiter);
app.use("/api/auth/reset-password", passwordResetLimiter);
app.use("/api/register-student", registerLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const requestId = crypto.randomUUID();
  let capturedJsonResponse: Record<string, any> | undefined;
  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);

      if (res.statusCode >= 500 && !res.locals.systemErrorLogged) {
        void systemLogger.error(
          new Error(
            typeof capturedJsonResponse?.message === "string"
              ? capturedJsonResponse.message
              : `Falha HTTP ${res.statusCode}`,
          ),
          {
            requestId,
            source: "http",
            message: `${req.method} ${path} respondeu com status ${res.statusCode}`,
            method: req.method,
            path,
            statusCode: res.statusCode,
            durationMs: duration,
            userId: req.user?.id,
            metadata: buildSafeMetadata({
              responseMessage: capturedJsonResponse?.message,
              queryKeys: Object.keys(req.query || {}),
              bodyKeys: req.body && typeof req.body === "object" ? Object.keys(req.body) : [],
            }),
          },
        );
      }
    }
  });

  next();
});

(async () => {
  // Initialize database and default users
  try {
    log("Initializing database and default users...");
    await initializeSystemLogs();
    await initializeDefaultAdmin();
    log("Database initialization completed");
  } catch (error) {
    log(`Database initialization error: ${error}`);
    await systemLogger.error(error, {
      source: "startup",
      message: "Falha durante a inicialização do banco de dados",
    });
  }

  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.locals.systemErrorLogged = true;
    void systemLogger.error(err, {
      requestId: res.locals.requestId,
      source: "express",
      message,
      method: req.method,
      path: req.path,
      statusCode: status,
      userId: req.user?.id,
      metadata: buildSafeMetadata({
        queryKeys: Object.keys(req.query || {}),
        bodyKeys: req.body && typeof req.body === "object" ? Object.keys(req.body) : [],
      }),
    });
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
