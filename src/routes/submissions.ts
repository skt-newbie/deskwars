import { Router } from "express";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import prisma from "../db/index.js";
import { getSessionUser } from "../middleware/auth.js";
import { AIQueueManager } from "../lib/aiQueue.js";

const router = Router();
const queueManager = new AIQueueManager();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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
  limits: { fileSize: 5 * 1024 * 1024 },
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

// Get submission counts
router.get("/counts", async (req, res) => {
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const submissions = await prisma.submission.findMany({
    where: {
      user: { email: user.email! },
      processingStatus: { not: 'failed' }
    },
    select: { aiType: true }
  });

  const result = {
    desk: submissions.filter(s => s.aiType === 'desk').length,
    drawing: submissions.filter(s => s.aiType === 'drawing').length
  };

  console.log(`[API] Counts for ${user.email}:`, result);
  res.json(result);
});

// Upload image
router.post("/upload", async (req, res, next) => {
  console.log(`[API] Upload POST request from ${req.ip}. Content-Length: ${req.get('Content-Length')}`);
  
  const config = await prisma.gameConfig.findUnique({ 
    where: { gameId: 'roast-arena' } 
  });
  if (config && !config.isEnabled) {
    return res.status(403).json({ error: "Roast Arena is currently offline for maintenance." });
  }

  upload.single("image")(req, res, async (err) => {
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
      console.warn("[API] Upload blocked: Unauthorized");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!user.email) {
      console.warn("[API] Upload blocked: No email for user", user.id);
      return res.status(400).json({ error: "User email not found. Please log in again." });
    }

    const aiType = (req.body.aiType || 'desk') as string;

    const existingCount = await prisma.submission.count({
      where: {
        user: { email: user.email },
        aiType,
        processingStatus: { not: 'failed' }
      }
    });

    console.log(`[API] Submission check for ${user.email} / ${aiType}: ${existingCount}`);

    if (existingCount >= 2) {
      return res.status(429).json({ 
        error: `Maximum attempts reached for ${aiType}. You have already used your trial and final submission.` 
      });
    }

    const submissionMode = existingCount === 0 ? 'trial' : 'final';
    
    if (!req.file) {
      console.warn("[API] Upload failed: No file in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const submissionId = uuidv4();
    const imagePath = `/uploads/${req.file.filename}`;
    
    try {
      console.log(`[API] Creating ${submissionMode} submission ${submissionId} of type ${aiType} for ${user.email}`);
      
      await prisma.submission.create({
        data: {
          id: submissionId,
          userId: user.id,
          imagePath,
          processingStatus: 'pending',
          aiType,
          submissionMode
        }
      });
      
      queueManager.add(submissionId);
      
      res.json({ id: submissionId, imagePath, status: 'queued', mode: submissionMode });
    } catch (dbErr) {
      console.error("[API] DB error during upload:", dbErr);
      res.status(500).json({ error: "Database error during upload save" });
    }
  });
});

// Get submission status/results
router.get("/:id", async (req, res) => {
  const submission = await prisma.submission.findUnique({ 
    where: { id: req.params.id } 
  });
  if (!submission) return res.status(404).json({ error: "Not found" });
  res.json(submission);
});

// Get clues for submission
router.get("/:id/clues", async (req, res) => {
  const id = req.params.id;

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

  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return res.status(404).json({ error: "Submission not found" });

  const categories = submission.categoriesJson ? JSON.parse(submission.categoriesJson) : null;
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

  res.json({ id, clues, status: submission.processingStatus, score: submission.overallScore });
});

export default router;

// Made with Bob
