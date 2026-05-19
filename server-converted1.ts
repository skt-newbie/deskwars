import "dotenv/config";
import express from "express";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import cookieParser from "cookie-parser";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import prisma from "./src/db/index.js";

// --- Global AI Configuration ---
const AI_CONFIG = {
  MODEL: "gemini-2.5-flash-lite",
  COOLDOWN_MS: 4500, // Duration between AI requests to respect rate limits
  PROMPTS: {
    DRAWING: `You are an art critic. Judge this drawing. Tone: witty and encouraging. Return STRICT JSON: { "overall_score": 1-100, "categories": { "skill": 1-100, "originality": 1-100 }, "remark": "string" }`,
    DESK: `You are an office  carnival judge. Judge this desk setup. Tone: meme-worthy and witty. Return STRICT JSON: { "overall_score": 1-100, "categories": { "creativity": 1-100, "cleanliness": 1-100, "humor": 1-100, "theme_match": 1-100, "effort": 1-100 }, "remark": "string" }`
  }
};

const QR_HUNT_STEPS = [
  { step: 1, riddle: "I have keys but no locks. I have a space but no room. You can enter, but never leave. What am I?", answer: "keyboard", nextClue: "Look under the chair where the 'Ghost of Deadlines' sits." },
  { step: 2, riddle: "I am always running but have no legs. I have a mouth but never speak. What am I?", answer: "river", nextClue: "The next secret is hidden in the digital waves of the source code." },
  { step: 3, riddle: "The more of me there is, the less you see. What am I?", answer: "darkness", nextClue: "You have survived the Hunt. Claim your Mystery Prize!" }
];

// --- AI Queue System ---
const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
const aiKeys = rawKeys.split(",").map(k => k.trim()).filter(k => k.length > 0);
let currentAiKeyIndex = 0;

function getAiClient() {
  if (aiKeys.length === 0) throw new Error("No Gemini API keys found.");
  const key = aiKeys[currentAiKeyIndex];
  currentAiKeyIndex = (currentAiKeyIndex + 1) % aiKeys.length;
  return new GoogleGenAI({ apiKey: key });
}


const queueManager = new AIQueueManager();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
    }
  },
});

async function startServer() {
  await seedDatabase();
  
  const app = express();
  
  // LOG ALL INCOMING REQUESTS BEFORE ANY MIDDLEWARE
  app.use((req, res, next) => {
    console.log(`[SYS] ${req.method} ${req.url} - IP: ${req.ip} - Origin: ${req.get('Origin')}`);
    next();
  });

  const PORT = 3000;

  app.use(cors({
    origin: true,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(UPLOADS_DIR));
  
  // --- API Routes Definition ---
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // LOGGING MIDDLEWARE FOR API
  apiRouter.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  // --- Session Middleware ---
  

  // Auth: Login/Register
  apiRouter.post("/auth/login", async (req, res) => {
    const rawEmail = req.body.email;
    if (!rawEmail) return res.status(400).json({ error: "Email required" });

    const email = rawEmail.toLowerCase().trim();

    // Restrict to ibm.com or specific admin email
    const isIbmEmail = email.endsWith('@ibm.com');
    const isAdminEmail = email === 'sanjayt9845524530@gmail.com';

    if (!isIbmEmail && !isAdminEmail) {
      return res.status(403).json({ error: "Unauthorized access: Only IBM identities are permitted in this sector." });
    }

    // Try finding by email first
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user) {
      const id = uuidv4();
      const defaultUsername = email.split('@')[0]; // Fallback username
      const isAdmin = (email.startsWith('admin') || email === 'sanjayt9845524530@gmail.com') ? 1 : 0;
      db.prepare("INSERT INTO users (id, username, email, total_points, is_admin) VALUES (?, ?, ?, 0, ?)").run(id, defaultUsername, email, isAdmin);
      user = { id, username: defaultUsername, email, total_points: 0, qr_hunt_step: 1, is_admin: isAdmin };
    } else {
      // Auto-promote if email matches admin list but wasn't admin before
      const shouldBeAdmin = (email.startsWith('admin') || email === 'sanjayt9845524530@gmail.com');
      if (shouldBeAdmin && !user.is_admin) {
        db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(user.id);
        user.is_admin = 1;
      }
    }

    res.cookie("userId", user.id, { 
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      httpOnly: true,
      secure: false, // Changed to false for better dev environment compatibility
      sameSite: 'lax'
    });
    
    // Update last activity
    db.prepare("UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);
    res.json(user);
  });

  // --- Admin API ---
  

  apiRouter.get("/admin/status", requireAdmin, async (req, res) => {
    const configs = db.prepare("SELECT * FROM game_configs").all();
    const inventory = db.prepare("SELECT * FROM inventory").all();
    const stats = {
      totalUsers: await prisma.user.count(),
      totalSubmissions: await prisma.submission.count()
    };
    res.json({ configs, inventory, stats });
  });

  apiRouter.get("/games/configs", async (req, res) => {
    const configs = db.prepare("SELECT * FROM game_configs").all();
    res.json(configs);
  });

  apiRouter.post("/admin/toggle-game", requireAdmin, async (req, res) => {
    const { gameId, isEnabled } = req.body;
    db.prepare("UPDATE game_configs SET is_enabled = ? WHERE game_id = ?").run(isEnabled ? 1 : 0, gameId);
    res.json({ success: true, gameId, isEnabled });
  });

  apiRouter.post("/admin/update-inventory", requireAdmin, async (req, res) => {
    const { itemId, quantity } = req.body;
    db.prepare("UPDATE inventory SET quantity = ? WHERE id = ?").run(quantity, itemId);
    res.json({ success: true, itemId, quantity });
  });

  apiRouter.post("/admin/reset-platform", requireAdmin, async (req, res) => {
    try {
      // 1. Delete all non-admin users
      db.prepare("DELETE FROM users WHERE is_admin = 0 AND email != 'sanjayt9845524530@gmail.com'").run();
      
      // 2. Reset points and progress for remaining admins
      db.prepare("UPDATE users SET total_points = 0, qr_hunt_step = 1").run();
      
      // 3. Clear all activity tables
      await prisma.submission.deleteMany();
      await prisma.qrScan.deleteMany();
      await prisma.qrRiddleAttempt.deleteMany();
      await prisma.userMysteryClaim.deleteMany();
      await prisma.tickBoomSession.deleteMany();
      
      // Clear uploads directory files
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
          if (file !== '.gitkeep') {
            try {
              fs.unlinkSync(path.join(uploadsDir, file));
            } catch (err) {}
          }
        }
      }

      res.json({ success: true, message: "System purged. Chaos reset to zero." });
    } catch (e: any) {
      console.error("Purge failed:", e);
      res.status(500).json({ error: "Atomic core meltdown during purge." });
    }
  });

  // Current User
  apiRouter.get("/auth/me", async (req, res) => {
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json(user);
  });

  apiRouter.get("/submissions/counts", async (req, res) => {
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Important: Use email to aggregate attempts across sessions/ids if needed
    // We only count submissions that didn't FAIL. If it failed, they get to try again.
    const counts = db.prepare(`
      SELECT ai_type, COUNT(*) as count 
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE u.email = ? AND s.processing_status != 'failed'
      GROUP BY ai_type
    `).all(user.email) as any[];

    console.log(`[API] Counts for ${user.email}:`, counts);

    const result = {
      desk: counts.find(c => c.ai_type === 'desk')?.count || 0,
      drawing: counts.find(c => c.ai_type === 'drawing')?.count || 0
    };

    res.json(result);
  });

  // Upload Desk Image
  apiRouter.post("/upload", (req, res, next) => {
    console.log(`[API] Upload POST request to /api/upload from ${req.ip}. Content-Length: ${req.get('Content-Length')}`);
    
    // Check if Roast Arena is enabled
    const config = db.prepare("SELECT is_enabled FROM game_configs WHERE game_id = 'roast-arena'").get() as any;
    if (config && !config.is_enabled) {
      return res.status(403).json({ error: "Roast Arena is currently offline for maintenance." });
    }

    upload.single("image")(req, res, (err) => {
      if (err) {
        console.error("[API] Multer error in /upload:", err);
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ error: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ error: err.message || "Unknown upload error" });
      }

      console.log(`[API] Multer success. File: ${req.file?.filename}, Body:`, req.body);
      const user = await getSessionUser(req, res);
      if (!user) {
        console.warn("[API] Upload blocked: Unauthorized (User not found in DB)");
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!user.email) {
        console.warn("[API] Upload blocked: No email for user", user.id);
        return res.status(400).json({ error: "User email not found. Please log in again." });
      }

      const aiType = (req.body.aiType || 'desk') as string;

      // Check submission limit: Only twice per category (trial and submission)
      const existingSubmissions = db.prepare(`
        SELECT COUNT(*) as count 
        FROM submissions s
        JOIN users u ON s.user_id = u.id
        WHERE u.email = ? AND s.ai_type = ? AND s.processing_status != 'failed'
      `).get(user.email, aiType) as any;

      console.log(`[API] Submission check for ${user.email} / ${aiType}: ${existingSubmissions.count}`);

      if (existingSubmissions.count >= 2) {
        return res.status(429).json({ 
          error: `Maximum attempts reached for ${aiType}. You have already used your trial and final submission.` 
        });
      }

      const submissionMode = existingSubmissions.count === 0 ? 'trial' : 'final';
      
      if (!req.file) {
        console.warn("[API] Upload failed: No file in request after multer success");
        return res.status(400).json({ error: "No file uploaded" });
      }

      const submissionId = uuidv4();
      const imagePath = `/uploads/${req.file.filename}`;
      
      try {
        console.log(`[API] Creating ${submissionMode} submission ${submissionId} of type ${aiType} for ${user.email}`);
        
        db.prepare("INSERT INTO submissions (id, user_id, image_path, processing_status, ai_type, submission_mode) VALUES (?, ?, ?, 'pending', ?, ?)")
          .run(submissionId, user.id, imagePath, aiType, submissionMode);
        
        // Add to AI Queue
        queueManager.add(submissionId);
        
        res.json({ id: submissionId, imagePath, status: 'queued', mode: submissionMode });
      } catch (dbErr) {
        console.error("[API] DB error during upload:", dbErr);
        res.status(500).json({ error: "Database error during upload save" });
      }
    });
  });

  // Get Submission Status/Results
  apiRouter.get("/submissions/:id", async (req, res) => {
    const submission = db.prepare("SELECT * FROM submissions WHERE id = ?").get(req.params.id) as any;
    if (!submission) return res.status(404).json({ error: "Not found" });
    res.json(submission);
  });

  // --- Hidden Chaos: Scan and Survive QR Flow ---
  
  // Unified QR Process (Mystery Node vs Riddle Node)
  apiRouter.post("/qr/process", async (req, res) => {
    const { qrId } = req.body;
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!qrId) return res.status(400).json({ error: "No signature detected." });

    // Check if Hidden Chaos is enabled
    const configCheck = db.prepare("SELECT is_enabled FROM game_configs WHERE game_id = 'hidden-chaos'").get() as any;
    if (configCheck && !configCheck.is_enabled) {
      return res.status(403).json({ error: "Hidden Chaos zone is currently stabilized and inactive." });
    }

    // PRIORITY 1: Check if this is a Riddle Node (Option 2)
    const qrDef = db.prepare("SELECT * FROM qr_definitions WHERE qr_id = ?").get(qrId) as any;
    
    if (qrDef) {
      // RIDDLE FLOW (Check if already solved by this user)
      const scan = db.prepare("SELECT * FROM future_qr_scans WHERE user_id = ? AND qr_id = ?").get(user.id, qrId) as any;
      if (scan) {
        return res.json({ 
          type: 'riddle',
          status: 'completed', 
          nextClue: qrDef.next_clue,
          points: scan.points,
          prize: scan.prize_claimed
        });
      }

      let attemptRec = db.prepare("SELECT * FROM qr_riddle_attempts WHERE user_id = ? AND qr_id = ?").get(user.id, qrId) as any;
      if (!attemptRec) {
        db.prepare("INSERT INTO qr_riddle_attempts (id, user_id, qr_id, attempts, is_solved) VALUES (?, ?, ?, 0, 0)")
          .run(uuidv4(), user.id, qrId);
        attemptRec = { attempts: 0, is_solved: 0 };
      }

      return res.json({
        type: 'riddle',
        qrId,
        status: attemptRec.attempts >= 5 ? 'failed' : 'active',
        attempts: attemptRec.attempts,
        riddle: qrDef.riddle,
        isSolved: attemptRec.is_solved,
        nextClue: attemptRec.attempts >= 5 ? qrDef.next_clue : null
      });
    } 

    // PRIORITY 2: Check if this is a Mystery Node (Option 1: Unique claimable ID)
    const mysteryNode = db.prepare("SELECT * FROM mystery_nodes WHERE id = ?").get(qrId) as any;
    if (mysteryNode) {
      // Check if user has already claimed THIS specific mystery ID
      const alreadyClaimed = db.prepare("SELECT * FROM user_mystery_claims WHERE user_id = ? AND node_id = ?").get(user.id, qrId) as any;
      
      if (alreadyClaimed) {
        return res.json({
          type: 'mystery',
          success: false,
          alreadyClaimed: true,
          message: "Temporal Signature Exhausted. This node has already been assimilated into your lattice."
        });
      }

      // Claim it
      db.transaction(() => {
        db.prepare("INSERT INTO user_mystery_claims (id, user_id, node_id) VALUES (?, ?, ?)")
          .run(uuidv4(), user.id, qrId);
        db.prepare("UPDATE users SET total_points = total_points + ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?")
          .run(mysteryNode.points, user.id);
      })();

      return res.json({
        type: 'mystery',
        success: true,
        reward: { name: mysteryNode.reward_text, points: mysteryNode.points },
        message: `Mystery Node Decrypted! ${mysteryNode.reward_text} assimilated. (+${mysteryNode.points} points)`
      });
    }

    // IF NEITHER: Return error
    return res.status(404).json({ error: "Unsupported Temporal Signal. This QR code is not part of the Hidden Chaos." });
  });

  apiRouter.get("/qr/status/:qrId", async (req, res) => {
    const { qrId } = req.params;
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const qrDef = db.prepare("SELECT * FROM qr_definitions WHERE qr_id = ?").get(qrId) as any;
    if (!qrDef) return res.status(404).json({ error: "QR Code not found in the Chaos Lattice." });

    // Check configuration
    const config = db.prepare("SELECT is_enabled FROM game_configs WHERE game_id = 'hidden-chaos'").get() as any;
    if (!config?.is_enabled) return res.status(503).json({ error: "Zone Stabilizing Chaos..." });

    // Check if player already finished this QR
    const scan = db.prepare("SELECT * FROM future_qr_scans WHERE user_id = ? AND qr_id = ?").get(user.id, qrId) as any;
    if (scan) {
      return res.json({ 
        status: 'completed', 
        nextClue: qrDef.next_clue,
        points: scan.points,
        prize: scan.prize_claimed
      });
    }

    // Get riddle attempts
    let attemptRec = db.prepare("SELECT * FROM qr_riddle_attempts WHERE user_id = ? AND qr_id = ?").get(user.id, qrId) as any;
    if (!attemptRec) {
      const id = uuidv4();
      db.prepare("INSERT INTO qr_riddle_attempts (id, user_id, qr_id, attempts, is_solved) VALUES (?, ?, ?, 0, 0)")
        .run(id, user.id, qrId);
      attemptRec = { attempts: 0, is_solved: 0 };
    }

    res.json({
      status: attemptRec.attempts >= 5 ? 'failed' : 'active',
      attempts: attemptRec.attempts,
      riddle: qrDef.riddle,
      isSolved: attemptRec.is_solved,
      nextClue: attemptRec.attempts >= 5 ? qrDef.next_clue : null
    });
  });

  apiRouter.post("/qr/submit-riddle", async (req, res) => {
    const { qrId, answer } = req.body;
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const qrDef = db.prepare("SELECT * FROM qr_definitions WHERE qr_id = ?").get(qrId) as any;
    if (!qrDef) return res.status(404).json({ error: "QR Undefined" });

    let attemptRec = db.prepare("SELECT * FROM qr_riddle_attempts WHERE user_id = ? AND qr_id = ?").get(user.id, qrId) as any;
    if (!attemptRec || attemptRec.attempts >= 5) return res.status(403).json({ error: "Maximum attempts used." });

    const isCorrect = answer?.toLowerCase().trim() === qrDef.answer.toLowerCase();
    
    db.transaction(() => {
      const newAttempts = attemptRec.attempts + 1;
      db.prepare("UPDATE qr_riddle_attempts SET attempts = ?, is_solved = ? WHERE user_id = ? AND qr_id = ?")
        .run(newAttempts, isCorrect ? 1 : 0, user.id, qrId);

      if (isCorrect) {
        // SOLVED logic
        // Check Path A (First Person EVER to solve this QR)
        const totalSolvedCount = (db.prepare("SELECT COUNT(*) as count FROM qr_riddle_attempts WHERE qr_id = ? AND is_solved = 1").get() as any).count;
        
        // If solved count IS 1 (meaning THIS person was the first to update it to 1 just now)
        // Actually, we should check if any future_qr_scans exist for Path A prizes
        const globalSolvedCount = (db.prepare("SELECT COUNT(*) as count FROM future_qr_scans WHERE qr_id = ?").get() as any).count;
        
        if (globalSolvedCount === 0) {
          // PATH A: First Visitor
          // Just return success, frontend will prompt for prize selection
          res.json({ 
            success: true, 
            path: 'A', 
            message: "Atomic Lock Disengaged. You are the First Visitor.",
            guaranteedPrizeId: qrDef.guaranteed_prize_id
          });
        } else {
          // PATH B: Subsequent Visitor
          const points = 50;
          db.prepare("INSERT INTO future_qr_scans (id, user_id, qr_id, points, prize_claimed) VALUES (?, ?, ?, ?, ?)")
            .run(uuidv4(), user.id, qrId, points, 'DIGITAL_POINTS');
          db.prepare("UPDATE users SET total_points = total_points + ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?").run(points, user.id);
          
          res.json({ 
            success: true, 
            path: 'B', 
            points, 
            nextClue: qrDef.next_clue 
          });
        }
      } else {
        // INCORRECT logic
        if (newAttempts >= 5) {
          // Consolation
          const points = 10;
          db.prepare("INSERT INTO future_qr_scans (id, user_id, qr_id, points, prize_claimed) VALUES (?, ?, ?, ?, ?)")
            .run(uuidv4(), user.id, qrId, points, 'CONSOLATION');
          db.prepare("UPDATE users SET total_points = total_points + ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?").run(points, user.id);
          
          res.json({ 
            success: false, 
            attemptsDepleted: true, 
            points, 
            nextClue: qrDef.next_clue 
          });
        } else {
          res.json({ success: false, attempts: newAttempts });
        }
      }
    })();
  });

  apiRouter.post("/qr/claim-prize", async (req, res) => {
    const { qrId, mode } = req.body; // 'guaranteed' or 'randomizer'
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const qrDef = db.prepare("SELECT * FROM qr_definitions WHERE qr_id = ?").get(qrId) as any;
    if (!qrDef) return res.status(404).json({ error: "QR Undefined" });

    // Ensure First Visitor status is still valid (atomic check)
    const alreadyClaimed = (db.prepare("SELECT COUNT(*) as count FROM future_qr_scans WHERE qr_id = ?").get() as any).count;
    if (alreadyClaimed > 0) return res.status(403).json({ error: "Resource already claimed by another entity." });

    db.transaction(() => {
      let prizeType = "NOTHING";
      let points = 50; // Points from riddle solve

      if (mode === 'guaranteed') {
        const item = db.prepare("SELECT * FROM inventory WHERE id = ?").get(qrDef.guaranteed_prize_id) as any;
        if (item && item.quantity > 0) {
          db.prepare("UPDATE inventory SET quantity = quantity - 1 WHERE id = ?").run(item.id);
          prizeType = item.name;
        } else {
          points += (item?.digital_fallback_points || 50);
          prizeType = "FALLBACK_POINTS";
        }
      } else {
        // Randomizer
        const roll = Math.floor(Math.random() * 6) + 1;
        const prizeMap: Record<number, { name: string, pts: number }> = {
          1: { name: "Void Whispers (Nothing)", pts: 0 },
          2: { name: "Chaos Pen", pts: 10 },
          3: { name: "Void Notebook", pts: 20 },
          4: { name: "Chaos Mug", pts: 30 },
          5: { name: "Glitch T-Shirt", pts: 50 },
          6: { name: "Obsidian Headphones", pts: 100 }
        };
        const outcome = prizeMap[roll];
        prizeType = outcome.name;
        points += outcome.pts;
      }

      db.prepare("INSERT INTO future_qr_scans (id, user_id, qr_id, points, prize_claimed) VALUES (?, ?, ?, ?, ?)")
        .run(uuidv4(), user.id, qrId, points, prizeType);
      db.prepare("UPDATE users SET total_points = total_points + ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?")
        .run(points, user.id);

      res.json({ 
        success: true, 
        prizeType, 
        points, 
        nextClue: qrDef.next_clue 
      });
    })();
  });
  
  // Mystery Scan (Instant Reward)
  apiRouter.post("/qr/mystery-scan", async (req, res) => {
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const rewards = [
      { name: "Chaotic energy", points: 50 },
      { name: "A suspicious cookie", points: 25 },
      { name: "Vibe check passed", points: 100 },
      { name: "Coffee from the ghost", points: 40 }
    ];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    db.prepare("UPDATE users SET total_points = total_points + ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?").run(reward.points, user.id);
    
    res.json({ success: true, reward, message: `You scanned a mystery code! Reward: ${reward.name} (+${reward.points} points)` });
  });

  // QR Hunt Status
  apiRouter.get("/qr/hunt", async (req, res) => {
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const currentStep = user.qr_hunt_step || 1;
    const huntData = QR_HUNT_STEPS.find(s => s.step === currentStep);

    if (!huntData) {
      return res.json({ completed: true, message: "You have conquered the QR Hunt!" });
    }

    res.json({ step: currentStep, riddle: huntData.riddle });
  });

  // QR Hunt Submit Answer
  apiRouter.post("/qr/hunt/submit", async (req, res) => {
    const { answer } = req.body;
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const currentStep = user.qr_hunt_step || 1;
    const huntData = QR_HUNT_STEPS.find(s => s.step === currentStep);

    if (!huntData) return res.status(400).json({ error: "Hunt already completed" });

    if (answer.toLowerCase().trim() === huntData.answer.toLowerCase()) {
      const nextStep = currentStep + 1;
      db.prepare("UPDATE users SET qr_hunt_step = ?, total_points = total_points + 100, last_activity = CURRENT_TIMESTAMP WHERE id = ?").run(nextStep, user.id);
      
      const nextHuntData = QR_HUNT_STEPS.find(s => s.step === nextStep);
      return res.json({ 
        correct: true, 
        message: "Brilliant! You solved it.", 
        nextClue: nextHuntData ? huntData.nextClue : "The final prize is yours!",
        completed: !nextHuntData
      });
    } else {
      res.json({ correct: false, message: "Wrong! Chaos laughs at your failure." });
    }
  });

  // --- Tick Tick Boom Routes (High Fidelity) ---
  apiRouter.get("/games/tick-tick-boom/status", async (req, res) => {
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    let session = db.prepare("SELECT * FROM tick_boom_sessions WHERE user_id = ?").get(user.id) as any;
    if (!session) {
      const id = uuidv4();
      db.prepare("INSERT INTO tick_boom_sessions (id, user_id, attempts) VALUES (?, ?, ?)")
        .run(id, user.id, 0);
      session = { attempts: 0 };
    }
    
    const config = db.prepare("SELECT is_enabled FROM game_configs WHERE game_id = 'tick-tick-boom'").get() as any;
    res.json({ ...session, isEnabled: config?.is_enabled });
  });

  apiRouter.post("/games/tick-tick-boom/submit", async (req, res) => {
    const { targetTime, stopTime } = req.body; // In seconds
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Check if enabled
    const configCheck = db.prepare("SELECT is_enabled FROM game_configs WHERE game_id = 'tick-tick-boom'").get() as any;
    if (configCheck && !configCheck.is_enabled) {
      return res.status(403).json({ error: "Tick Tick Boom zone is currently offline." });
    }

    const session = db.prepare("SELECT * FROM tick_boom_sessions WHERE user_id = ?").get(user.id) as any;
    if (session && session.attempts >= 3) {
      return res.status(403).json({ error: "Attempts depleted. Atomic stability achieved." });
    }

    const delta = Math.abs(stopTime - targetTime);
    let points = 10; // Consolation
    let result = "BOOM";

    if (delta <= 0.05) {
      points = 500;
      result = "PERFECT";
    } else if (delta <= 0.5) {
      // Sliding scale: max 300 points at 0.06 delta, min 100 at 0.5 delta
      // formula: 300 - ((delta - 0.05) / 0.45) * 200
      points = Math.floor(300 - ((delta - 0.05) / 0.45) * 200);
      result = "CLOSE";
    }

    // Update attempts & points
    db.transaction(() => {
      db.prepare("UPDATE tick_boom_sessions SET attempts = attempts + 1, last_played = CURRENT_TIMESTAMP WHERE user_id = ?")
        .run(user.id);
      db.prepare("UPDATE users SET total_points = total_points + ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?")
        .run(points, user.id);
    })();

    res.json({ 
      success: true, 
      points, 
      delta, 
      result, 
      attemptsLeft: 3 - (session ? session.attempts + 1 : 1) 
    });
  });

  // Leaderboard (Enhanced)
  apiRouter.get("/leaderboard", async (req, res) => {
    const { category } = req.query;
    
    if (category === 'global') {
      const users = db.prepare(`
        SELECT 
          email as display_name,
          email,
          MAX(username) as username,
          SUM(total_points) as score,
          MAX(last_activity) as last_activity
        FROM users 
        GROUP BY email
        ORDER BY score DESC 
        LIMIT 10
      `).all();
      return res.json(users);
    }

    if (category === 'arena') {
      const users = db.prepare(`
        SELECT 
          u.email as display_name,
          u.email,
          MAX(u.username) as username,
          MAX(s.overall_score) as score 
        FROM submissions s 
        JOIN users u ON s.user_id = u.id 
        WHERE s.processing_status = 'completed' AND s.submission_mode = 'final'
        GROUP BY u.email
        ORDER BY score DESC 
        LIMIT 10
      `).all();
      return res.json(users);
    }

    // Default global
    const users = db.prepare(`
      SELECT 
        email as display_name,
        email,
        MAX(username) as username,
        SUM(total_points) as score,
        MAX(last_activity) as last_activity
      FROM users 
      GROUP BY email
      ORDER BY score DESC 
      LIMIT 10
    `).all();
    res.json(users);
  });

  // Latest Submissions
  apiRouter.get("/feed", async (req, res) => {
    const submissions = db.prepare(`
      SELECT s.*, u.email as username 
      FROM submissions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.processing_status = 'completed' 
      ORDER BY s.created_at DESC 
      LIMIT 20
    `).all();
    res.json(submissions);
  });

  // DEBUG: Clear Database (Development only)
  apiRouter.get("/debug/reset", async (req, res) => {
    try {
      db.transaction(() => {
        await prisma.submission.deleteMany();
        await prisma.user.deleteMany();
        await prisma.qrScan.deleteMany();
        await prisma.qrRiddleAttempt.deleteMany();
        await prisma.userMysteryClaim.deleteMany();
        await prisma.tickBoomSession.deleteMany();
      })();
      res.json({ success: true, message: "All user data purged. Tables and configs preserved." });
    } catch (error) {
      console.error("Debug reset failed:", error);
      res.status(500).json({ error: "Failed to clear database" });
    }
  });

  // Clues Endpoint
  apiRouter.get("/clues", async (req, res) => {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: "Submission ID required" });

    if (id === 'default') {
      return res.json({
        id: 'default',
        clues: [
          "The 'Ghost of Deadlines' suggests cleaning your cable nest.",
          "A rogue sticky note has become sentient. Beware.",
          "Your plant is judging your browser tabs. Choose wisely.",
          "Check your chair's posture settings—your spine will thank you.",
          "Consider adding a tiny plant to offset the electronic hum of your setup.",
        ],
        status: 'completed',
        score: 100
      });
    }

    const submission = db.prepare("SELECT * FROM submissions WHERE id = ?").get(id) as any;
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    const categories = submission.categories_json ? JSON.parse(submission.categories_json) : null;
    const clues = [
      "The 'Ghost of Deadlines' suggests cleaning your cable nest.",
      "A rogue sticky note has become sentient. Beware.",
      "Your plant is judging your browser tabs. Choose wisely.",
    ];

    if (categories) {
      Object.entries(categories).forEach(([name, data]: [string, any]) => {
        if (data.score < 5) {
          if (name === "Organization") clues.push("Organization: Your desk is currently a 'Where's Waldo' for your mouse.");
          if (name === "Aesthetics") clues.push("Aesthetics: The color palette screams 'Server Room' more than 'Home Office'.");
        }
      });
    }

    res.json({ id, clues, status: submission.processing_status, score: submission.overall_score });
  });

  // API 404 Handler - MUST be before Vite/SPA middleware
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

  // API Health Check (also here for convenience)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Alias for /clues as requested
  app.get("/clues", (req, res) => {
    res.redirect(`/api/clues?id=${req.query.id || ''}`);
  });

  // --- Vite Middleware ---
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
