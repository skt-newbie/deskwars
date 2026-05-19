import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import prisma from "../db/index.js";
import { getSessionUser } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/qr-hunt/scan/:qrId
 * Initial QR scan - returns riddle challenge
 */
router.get("/scan/:qrId", async (req, res) => {
  try {
    const { qrId } = req.params;
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Get QR definition
    const qrDef = await prisma.qrDefinition.findUnique({ 
      where: { qrId } 
    });
    
    if (!qrDef) {
      return res.status(404).json({ error: "QR Code not found" });
    }

    // Check if user already completed this QR
    const existingScan = await prisma.qrScan.findFirst({
      where: { userId: user.id, qrId }
    });

    if (existingScan) {
      return res.json({
        status: 'completed',
        message: 'You have already completed this QR challenge',
        nextClue: qrDef.nextClue,
        nextQrLocation: qrDef.nextQrLocation,
        points: existingScan.points,
        prize: existingScan.prizeClaimed
      });
    }

    // Get or create riddle attempt record
    let attemptRec = await prisma.qrRiddleAttempt.findFirst({
      where: { userId: user.id, qrId }
    });

    if (!attemptRec) {
      attemptRec = await prisma.qrRiddleAttempt.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          qrId,
          attempts: 0,
          isSolved: false
        }
      });
    }

    // Check if already failed (5 attempts used)
    if (attemptRec.attempts >= 5 && !attemptRec.isSolved) {
      return res.json({
        status: 'failed',
        message: 'You have used all 5 attempts',
        attemptsRemaining: 0,
        consolationPoints: 10,
        nextClue: qrDef.nextClue,
        nextQrLocation: qrDef.nextQrLocation
      });
    }

    // Return riddle challenge
    res.json({
      status: 'active',
      qrId,
      location: qrDef.location,
      riddle: qrDef.riddle,
      attempts: attemptRec.attempts,
      attemptsRemaining: 5 - attemptRec.attempts,
      isSolved: attemptRec.isSolved
    });

  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/qr-hunt/submit-riddle
 * Submit riddle answer
 */
router.post("/submit-riddle", async (req, res) => {
  try {
    const { qrId, answer } = req.body;
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!answer) {
      return res.status(400).json({ error: "Answer is required" });
    }

    // Get QR definition
    const qrDef = await prisma.qrDefinition.findUnique({ 
      where: { qrId } 
    });
    
    if (!qrDef) {
      return res.status(404).json({ error: "QR Code not found" });
    }

    // Get attempt record
    let attemptRec = await prisma.qrRiddleAttempt.findFirst({
      where: { userId: user.id, qrId }
    });

    if (!attemptRec) {
      return res.status(400).json({ error: "No active attempt found. Scan the QR first." });
    }

    if (attemptRec.attempts >= 5) {
      return res.status(403).json({ error: "Maximum attempts exceeded" });
    }

    if (attemptRec.isSolved) {
      return res.status(400).json({ error: "Riddle already solved" });
    }

    // Check answer
    const isCorrect = answer.toLowerCase().trim() === qrDef.answer.toLowerCase().trim();
    const newAttempts = attemptRec.attempts + 1;

    // Update attempt record
    await prisma.qrRiddleAttempt.update({
      where: { id: attemptRec.id },
      data: {
        attempts: newAttempts,
        isSolved: isCorrect
      }
    });

    if (isCorrect) {
      // Riddle solved! Check if first user
      const existingScans = await prisma.qrScan.count({ where: { qrId } });
      const isFirstUser = existingScans === 0;

      if (isFirstUser) {
        // First user - offer prize choice
        return res.json({
          success: true,
          correct: true,
          isFirstUser: true,
          message: "🎉 Brilliant! You are the FIRST to solve this riddle!",
          riddlePoints: 50,
          guaranteedPrizeId: qrDef.guaranteedPrizeId,
          nextStep: 'choose_prize' // User needs to choose: guaranteed or randomizer
        });
      } else {
        // Subsequent user - auto award points
        const points = 50;
        
        await prisma.qrScan.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            qrId,
            points,
            prizeClaimed: 'DIGITAL_POINTS'
          }
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            totalPoints: { increment: points },
            lastActivity: new Date()
          }
        });

        return res.json({
          success: true,
          correct: true,
          isFirstUser: false,
          message: "✅ Correct! Riddle solved.",
          points,
          nextClue: qrDef.nextClue,
          nextQrLocation: qrDef.nextQrLocation
        });
      }
    } else {
      // Wrong answer
      if (newAttempts >= 5) {
        // All attempts used - give consolation
        const consolationPoints = 10;
        
        await prisma.qrScan.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            qrId,
            points: consolationPoints,
            prizeClaimed: 'CONSOLATION'
          }
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            totalPoints: { increment: consolationPoints },
            lastActivity: new Date()
          }
        });

        return res.json({
          success: false,
          correct: false,
          attemptsDepleted: true,
          message: "❌ All attempts used. Here's a consolation prize.",
          consolationPoints,
          nextClue: qrDef.nextClue,
          nextQrLocation: qrDef.nextQrLocation
        });
      } else {
        // Still have attempts
        return res.json({
          success: false,
          correct: false,
          message: "❌ Wrong answer. Try again!",
          attempts: newAttempts,
          attemptsRemaining: 5 - newAttempts
        });
      }
    }

  } catch (error) {
    console.error('Submit riddle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/qr-hunt/claim-prize
 * Claim prize (for first user only)
 */
router.post("/claim-prize", async (req, res) => {
  try {
    const { qrId, mode } = req.body; // mode: 'guaranteed' or 'randomizer'
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!mode || !['guaranteed', 'randomizer'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode. Must be 'guaranteed' or 'randomizer'" });
    }

    // Get QR definition
    const qrDef = await prisma.qrDefinition.findUnique({ 
      where: { qrId } 
    });
    
    if (!qrDef) {
      return res.status(404).json({ error: "QR Code not found" });
    }

    // Verify user solved the riddle
    const attemptRec = await prisma.qrRiddleAttempt.findFirst({
      where: { userId: user.id, qrId, isSolved: true }
    });

    if (!attemptRec) {
      return res.status(403).json({ error: "You must solve the riddle first" });
    }

    // Check if already claimed
    const existingScan = await prisma.qrScan.findFirst({
      where: { userId: user.id, qrId }
    });

    if (existingScan) {
      return res.status(400).json({ error: "Prize already claimed" });
    }

    // Verify this is the first user
    const existingScans = await prisma.qrScan.count({ where: { qrId } });
    if (existingScans > 0) {
      return res.status(403).json({ error: "Prize already claimed by another user" });
    }

    let prizeResult: any = {
      riddlePoints: 50,
      prizePoints: 0,
      prizeName: null,
      inventoryId: null
    };

    if (mode === 'guaranteed') {
      // Guaranteed prize
      if (!qrDef.guaranteedPrizeId) {
        return res.status(400).json({ error: "No guaranteed prize configured for this QR" });
      }

      const item = await prisma.inventory.findUnique({
        where: { id: qrDef.guaranteedPrizeId }
      });

      if (!item) {
        return res.status(404).json({ error: "Guaranteed prize not found in inventory" });
      }

      if (item.quantity > 0) {
        // Physical prize available
        await prisma.inventory.update({
          where: { id: item.id },
          data: { quantity: { decrement: 1 } }
        });

        // Record prize claim
        await prisma.prizeClaim.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            inventoryId: item.id,
            allocationId: null,
            claimType: 'qr_scan'
          }
        });

        prizeResult.prizeName = item.name;
        prizeResult.prizePoints = item.digitalFallbackPoints;
        prizeResult.inventoryId = item.id;
        prizeResult.type = 'physical';
      } else {
        // Out of stock - give digital points
        prizeResult.prizeName = `${item.name} (Digital Points)`;
        prizeResult.prizePoints = item.digitalFallbackPoints;
        prizeResult.type = 'digital_fallback';
      }
    } else {
      // Randomizer - get random prize from QR game allocations
      const qrAllocations = await prisma.gameAllocation.findMany({
        where: { gameCode: 'QR' },
        include: { inventory: true }
      });

      if (qrAllocations.length === 0) {
        return res.status(500).json({ error: "No QR prizes configured" });
      }

      // Randomly select one allocation
      const randomIndex = Math.floor(Math.random() * qrAllocations.length);
      const selectedAllocation = qrAllocations[randomIndex];
      const item = selectedAllocation.inventory;

      if (item.quantity > 0) {
        // Physical prize available
        await prisma.inventory.update({
          where: { id: item.id },
          data: { quantity: { decrement: 1 } }
        });

        // Record prize claim
        await prisma.prizeClaim.create({
          data: {
            id: uuidv4(),
            userId: user.id,
            inventoryId: item.id,
            allocationId: selectedAllocation.allocationId,
            claimType: 'qr_scan'
          }
        });

        prizeResult.prizeName = item.name;
        prizeResult.prizePoints = item.digitalFallbackPoints;
        prizeResult.inventoryId = item.id;
        prizeResult.allocationId = selectedAllocation.allocationId;
        prizeResult.category = selectedAllocation.category;
        prizeResult.type = 'physical';
      } else {
        // Out of stock - give digital points
        prizeResult.prizeName = `${item.name} (Digital Points)`;
        prizeResult.prizePoints = item.digitalFallbackPoints;
        prizeResult.type = 'digital_fallback';
      }
    }

    const totalPoints = prizeResult.riddlePoints + prizeResult.prizePoints;

    // Create QR scan record
    await prisma.qrScan.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        qrId,
        points: totalPoints,
        prizeClaimed: prizeResult.prizeName || 'POINTS_ONLY'
      }
    });

    // Update user points
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: totalPoints },
        lastActivity: new Date()
      }
    });

    res.json({
      success: true,
      mode,
      prize: prizeResult,
      totalPoints,
      nextClue: qrDef.nextClue,
      nextQrLocation: qrDef.nextQrLocation
    });

  } catch (error) {
    console.error('Claim prize error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/qr-hunt/mystery-gift
 * Scan Mystery Gift QR (MB game - instant prize based on allocation)
 */
router.post("/mystery-gift", async (req, res) => {
  try {
    const { allocationId } = req.body; // e.g., MB_01, MB_02, etc.
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!allocationId) {
      return res.status(400).json({ error: "Allocation ID is required" });
    }

    // Get game allocation
    const allocation = await prisma.gameAllocation.findUnique({
      where: { allocationId },
      include: { inventory: true }
    });

    if (!allocation) {
      return res.status(404).json({ error: "Mystery gift not found" });
    }

    if (allocation.gameCode !== 'MB') {
      return res.status(400).json({ error: "This is not a mystery gift allocation" });
    }

    // Check if user already claimed this specific mystery gift
    const existingClaim = await prisma.prizeClaim.findFirst({
      where: {
        userId: user.id,
        allocationId: allocationId
      }
    });

    if (existingClaim) {
      return res.status(400).json({
        error: "You have already claimed this mystery gift",
        alreadyClaimed: true
      });
    }

    const item = allocation.inventory;
    let result: any = {
      allocationId,
      category: allocation.category,
      rewardType: allocation.rewardType
    };

    if (item.quantity > 0) {
      // Physical prize available
      await prisma.inventory.update({
        where: { id: item.id },
        data: { quantity: { decrement: 1 } }
      });

      result.prizeName = item.name;
      result.points = item.digitalFallbackPoints;
      result.type = 'physical';
    } else {
      // Out of stock - give digital points
      result.prizeName = `${item.name} (Digital Points)`;
      result.points = item.digitalFallbackPoints;
      result.type = 'digital_fallback';
    }

    // Record prize claim
    await prisma.prizeClaim.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        inventoryId: item.id,
        allocationId: allocationId,
        claimType: 'mystery_box'
      }
    });

    // Update user points
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: result.points },
        lastActivity: new Date()
      }
    });

    res.json({
      success: true,
      prize: result
    });

  } catch (error) {
    console.error('Mystery gift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/qr-hunt/my-prizes
 * Get user's claimed prizes
 */
router.get("/my-prizes", async (req, res) => {
  try {
    const user = await getSessionUser(req, res);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const prizes = await prisma.prizeClaim.findMany({
      where: { userId: user.id },
      include: {
        inventory: true
      },
      orderBy: { claimedAt: 'desc' }
    });

    res.json({ prizes });

  } catch (error) {
    console.error('Get prizes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// Made with Bob
