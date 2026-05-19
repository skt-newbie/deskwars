import "dotenv/config";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { seedDatabase } from "./src/lib/seed.js";

// Import routes
import authRoutes from "./src/routes/auth.js";
import adminRoutes from "./src/routes/admin.js";
import submissionRoutes from "./src/routes/submissions.js";
import gameRoutes from "./src/routes/games.js";
import leaderboardRoutes from "./src/routes/leaderboard.js";
import qrHuntRoutes from "./src/routes/qr-hunt.js";

async function startServer() {
  // Seed database on startup
  await seedDatabase();
  
  const app = express();
  
  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[SYS] ${req.method} ${req.url} - IP: ${req.ip} - Origin: ${req.get('Origin')}`);
    next();
  });

  const PORT = 3000;

  // Middleware
  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  
  // API Routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // API logging middleware
  apiRouter.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // Mount route modules
  apiRouter.use("/auth", authRoutes);
  apiRouter.use("/admin", adminRoutes);
  apiRouter.use("/submissions", submissionRoutes);
  apiRouter.use("/games", gameRoutes);
  apiRouter.use("/leaderboard", leaderboardRoutes);
  apiRouter.use("/qr-hunt", qrHuntRoutes);
  
  // Legacy QR routes - create direct handlers that call games routes
  // This is needed because games routes have /qr/ prefix already
  apiRouter.post("/qr/process", (req, res, next) => {
    // Change the URL to match the games router expectation
    const originalUrl = req.url;
    req.url = '/qr/process';
    req.baseUrl = '/api/games';
    
    // Call the games router
    gameRoutes(req, res, (err) => {
      if (err) next(err);
      // Restore original URL if needed
      req.url = originalUrl;
    });
  });
  
  apiRouter.post("/qr/submit-riddle", (req, res, next) => {
    req.url = '/qr/submit-riddle';
    req.baseUrl = '/api/games';
    gameRoutes(req, res, (err) => { if (err) next(err); });
  });
  
  apiRouter.post("/qr/claim-prize", (req, res, next) => {
    req.url = '/qr/claim-prize';
    req.baseUrl = '/api/games';
    gameRoutes(req, res, (err) => { if (err) next(err); });
  });
  
  apiRouter.get("/qr/status/:qrId", (req, res, next) => {
    req.url = `/qr/status/${req.params.qrId}`;
    req.baseUrl = '/api/games';
    gameRoutes(req, res, (err) => { if (err) next(err); });
  });

  // Legacy route aliases for compatibility
  apiRouter.get("/feed", (req, res) => {
    res.redirect('/api/leaderboard/feed');
  });

  // Clues endpoint (legacy compatibility)
  apiRouter.get("/clues", (req, res) => {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: "Submission ID required" });
    res.redirect(`/api/submissions/${id}/clues`);
  });

  // Legacy upload route - redirect to proper endpoint
  apiRouter.post("/upload", (req, res) => {
    console.log("[API] Legacy /upload route handler called");
    res.redirect(307, '/api/submissions/upload');
  });
  
  apiRouter.get("/upload", (req, res) => {
    console.log("[API] GET /upload called");
    res.redirect('/api/submissions/upload');
  });

  // API Health Check (before 404 handler)
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", database: "postgresql" });
  });

  // API 404 Handler (must be last)
  apiRouter.all("*", (req, res) => {
    console.warn(`[API] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Global API Error Handler
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[API] Fatal Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error"
    });
  });

  // Legacy /clues alias
  app.get("/clues", (req, res) => {
    const id = req.query.id as string;
    res.redirect(`/api/submissions/${id || 'default'}/clues`);
  });

  // Vite Middleware for development / Static files for production
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Database: PostgreSQL`);
    console.log(`✅ All routes loaded successfully`);
  });
}

startServer().catch(err => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

// Made with Bob
