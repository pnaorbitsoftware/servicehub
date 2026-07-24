process.on("uncaughtException", (error) => {
  console.error("🔥 CRITICAL: Uncaught Exception:", error?.stack || error);
});

process.on("unhandledRejection", (reason) => {
  console.error("🔥 CRITICAL: Unhandled Promise Rejection:", reason?.stack || reason);
});

import cors from "cors";
import compression from "compression";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import http from "node:http";

import notificationRoutes from "./src/routes/notificationRoutes.js";

import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import catalogRoutes, { warmCatalogCache } from "./src/routes/catalogRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import providerRoutes from "./src/routes/providerRoutes.js";
import supportRoutes from "./src/routes/supportRoutes.js";
import { connectToDatabase, getDatabaseStatus, mongoDbName } from "./src/database/mongo.js";
import setupDatabase from "./src/database/setupDatabase.js";
import { responseTimeLogger } from "./src/middleware/performance.js";
import { setupTrackingSocket } from "./src/socket/trackingSocket.js";

const app = express();
app.disable("x-powered-by");

const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
const siteUrl = (process.env.SITE_URL || process.env.CLIENT_URL || "https://servicehub.aparaitech.org").replace(/\/$/, "");
const sitemapRoutes = [
  "/",
  "/contact",
  "/privacy-policy",
  "/terms-and-conditions",
  "/services/electrician-near-me",
  "/services/plumber-near-me",
  "/services/carpenter-near-me",
  "/services/ac-repair-near-me",
  "/services/home-cleaning-services",
  "/services/painting-services",
  "/services/appliance-repair",
  "/locations/pune",
  "/locations/mumbai",
  "/locations/nashik",
  "/locations/baramati",
];

//
// ✅ FIXED CORS CONFIG (PRODUCTION READY)
//
const configuredOrigins = String(process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://servicehub.aparaitech.org",
  "https://www.servicehub.aparaitech.org",
  ...configuredOrigins,
].filter(Boolean);
const allowedOriginSet = new Set(allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // allow Postman or server-to-server
    if (!origin) return callback(null, true);

    // exact match
    if (allowedOriginSet.has(origin)) {
      return callback(null, true);
    }

    // ✅ Allow any Vercel preview deployment for your project
        // ✅ Allow any Vercel deployment for this project
    try {
      const { hostname } = new URL(origin);
      
      // Match: any vercel.app URL containing "all-in-one-services"
      if (hostname.includes('all-in-one-services') && hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      // Also match your custom domain and www
      if (['servicehub.aparaitech.org', 'www.servicehub.aparaitech.org'].includes(hostname)) {
        return callback(null, true);
      }
    } catch {
      return callback(new Error("Invalid request origin."));
    }

    if (!isProduction) {
      try {
        const { hostname } = new URL(origin);
        if (
          ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname) ||
          /^192\.168\.\d+\.\d+$/i.test(hostname) ||
          /^10\.\d+\.\d+\.\d+$/i.test(hostname) ||
          /^172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+$/i.test(hostname)
        ) {
          return callback(null, true);
        }
      } catch {
        return callback(new Error("Invalid request origin."));
      }
    }

    console.error("❌ Blocked by CORS:", origin);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  maxAge: 86400,
};
app.set("trust proxy", 1);
app.use((req, res, next) => {
  if (isProduction && process.env.FORCE_HTTPS !== "false" && req.headers["x-forwarded-proto"] === "http") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  next();
});
app.use(cors(corsOptions));
app.use(responseTimeLogger);
app.use(compression());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "7mb" }));

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    [
      "/api/auth/register",
      "/api/auth/registration-status",
      "/api/auth/logout",
      "/api/auth/me",
      "/api/auth/whatsapp/status",
    ].includes(req.originalUrl.split("?")[0]),
  message: { message: "Too many authentication attempts. Please try again shortly." },
});

const passwordRecoveryLimiter = rateLimit({
  windowMs: Number(process.env.PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  limit: Number(process.env.PASSWORD_RECOVERY_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password recovery attempts. Please try again shortly." },
});

//
// Health check
//
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ServiceHub API is running"
  });
});
app.get("/api/health", (_req, res) => {
  const dbStatus = getDatabaseStatus();
  res.status(dbStatus.connected ? 200 : 503).json({
    status: dbStatus.connected ? "ok" : "unavailable",
    uptimeSeconds: Math.round(process.uptime()),
    databaseName: mongoDbName,
    database: dbStatus.connected ? "connected" : "disconnected",
  });
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
});

app.get("/sitemap.xml", (_req, res) => {
  const urls = sitemapRoutes
    .map((route) => {
      const priority = route === "/" ? "1.0" : route.startsWith("/services") ? "0.9" : "0.8";
      const changefreq = route === "/" ? "daily" : route.includes("policy") || route.includes("terms") ? "yearly" : "weekly";
      return `  <url><loc>${siteUrl}${route === "/" ? "" : route}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
    })
    .join("\n");

  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

//
// Middleware: DB check
//
const requireDatabase = (_req, res, next) => {
  if (!getDatabaseStatus().connected) {
    return res.status(503).json({
      message:
        "Database is not connected. Start MongoDB or check connection.",
    });
  }
  next();
};

//
// Routes
//

app.use("/api/notifications", requireDatabase, notificationRoutes);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", passwordRecoveryLimiter);
app.use("/api/auth/reset-password", passwordRecoveryLimiter);
app.use("/api/auth", requireDatabase, authRoutes);
app.use("/api/admin", requireDatabase, adminRoutes);
app.use("/api/bookings", requireDatabase, bookingRoutes);
app.use("/api/contact", requireDatabase, contactRoutes);
app.use("/api/catalog", requireDatabase, catalogRoutes);
app.use("/api/location", requireDatabase, locationRoutes);
app.use("/api/payments", requireDatabase, paymentRoutes);
app.use("/api/providers", requireDatabase, providerRoutes);
app.use("/api/support", requireDatabase, supportRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.use((error, req, res, _next) => {
  if (error?.message?.includes("is not allowed by CORS") || error?.message === "Invalid request origin.") {
    return res.status(403).json({ message: "Request origin is not allowed." });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      message: "The selected image is too large to upload. Choose a smaller image and try again.",
    });
  }

  console.error(`Unhandled ${req.method} ${req.originalUrl}: ${error?.message || "Unknown error"}`);
  return res.status(500).json({ message: "Unexpected server error." });
});

const runStartupMaintenance = async () => {
  if (isProduction && process.env.RUN_STARTUP_MAINTENANCE !== "true") {
    console.log("Startup database maintenance skipped in production.");
    return;
  }

  const startedAt = Date.now();
  await setupDatabase();
  console.log(`Startup database maintenance completed in ${Date.now() - startedAt}ms`);
};

const startServer = async () => {
  try {
    const connectedAt = Date.now();
    await connectToDatabase();

    console.log(
      `Connected to MongoDB database "${mongoDbName}" in ${Date.now() - connectedAt}ms`,
    );

    const catalogWarmStartedAt = Date.now();
    try {
      await warmCatalogCache();
      console.log(`Catalog cache warmed in ${Date.now() - catalogWarmStartedAt}ms`);
    } catch (error) {
      console.warn(`Catalog cache warmup skipped: ${error.message}`);
    }

    try {
      await runStartupMaintenance();
    } catch (error) {
      console.warn(`Startup database maintenance failed: ${error.message}`);
    }

    const server = http.createServer(app);
    server.keepAliveTimeout = Number(process.env.SERVER_KEEP_ALIVE_TIMEOUT_MS || 65000);
    server.headersTimeout = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 66000);
    server.requestTimeout = Number(process.env.SERVER_REQUEST_TIMEOUT_MS || 30000);

    const io = await setupTrackingSocket(server, corsOptions);
    app.set("io", io);

    server.listen(port, () => {
      console.log(
        `Server running on http://localhost:${port}`
      );
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} already in use`);
      } else {
        console.error(`Server error: ${error.message}`);
      }
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exitCode = 1;
  }
};

startServer();
