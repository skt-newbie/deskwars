import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import prisma from "../db/index.js";
import { getSessionUser } from "../middleware/auth.js";

const router = Router();

const QR_HUNT_STEPS = [
  { step: 1, riddle: "I have keys but no locks. I have a space but no room. You can enter, but never leave. What am I?", answer: "keyboard", nextClue: "Look under the chair where the 'Ghost of Deadlines' sits." },
  { step: 2, riddle: "I am always running but have no legs. I have a mouth but never speak. What am I?", answer: "river", nextClue: "The next secret is hidden in the digital waves of the source code." },
  { step: 3, riddle: "The more of me there is, the less you see. What am I?", answer: "darkness", nextClue: "You have survived the Hunt. Claim your Mystery Prize!" }
];

// Get game configs
router.get("/configs", async (req, res) => {
  const configs = await prisma.gameConfig.findMany();
  res.json(configs);
});

// === QR HUNT ===
router.get("/qr/hunt", async (req, res) => {
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const currentStep = user.qrHuntStep || 1;
  const huntData = QR_HUNT_STEPS.find(s => s.step === currentStep);

  if (!huntData) {
    return res.json({ completed: true, message: "You have conquered the QR Hunt!" });
  }

  res.json({ step: currentStep, riddle: huntData.riddle });
});

router.post("/qr/hunt/submit", async (req, res) => {
  const { answer } = req.body;
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const currentStep = user.qrHuntStep || 1;
  const huntData = QR_HUNT_STEPS.find(s => s.step === currentStep);

  if (!huntData) return res.status(400).json({ error: "Hunt already completed" });

  if (answer.toLowerCase().trim() === huntData.answer.toLowerCase()) {
    const nextStep = currentStep + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        qrHuntStep: nextStep,
        totalPoints: { increment: 100 },
        lastActivity: new Date()
      }
    });
    
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

// === HIDDEN CHAOS: QR PROCESS ===
router.post("/qr/process", async (req, res) => {
  const { qrId } = req.body;
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (!qrId) return res.status(400).json({ error: "No signature detected." });

  const configCheck = await prisma.gameConfig.findUnique({
    where: { gameId: 'hidden-chaos' }
  });
  if (configCheck && !configCheck.isEnabled) {
    return res.status(403).json({ error: "Hidden Chaos zone is currently stabilized and inactive." });
  }

  // PRIORITY 1: Check if this is a Riddle Node
  const qrDef = await prisma.qrDefinition.findUnique({ where: { qrId } });
  
  if (qrDef) {
    // Check if user has already completed this QR
    const existingClaim = await prisma.prizeClaim.findFirst({
      where: {
        userId: user.id,
        allocationId: qrId
      }
    });
    
    if (existingClaim) {
      return res.json({
        type: 'riddle',
        status: 'completed',
        nextClue: qrDef.nextClue,
        nextLocation: qrDef.nextQrLocation,
        message: "You've already completed this challenge!"
      });
    }

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

    return res.json({
      type: 'riddle',
      qrId,
      location: qrDef.location,
      status: attemptRec.attempts >= 5 ? 'failed' : 'active',
      attempts: attemptRec.attempts,
      riddle: qrDef.riddle,
      isSolved: attemptRec.isSolved,
      nextClue: attemptRec.attempts >= 5 ? qrDef.nextClue : null,
      nextLocation: attemptRec.attempts >= 5 ? qrDef.nextQrLocation : null
    });
  }

  // PRIORITY 2: Check if this is a Mystery Node (legacy)
  const mysteryNode = await prisma.mysteryNode.findUnique({ where: { id: qrId } });
  if (mysteryNode) {
    const alreadyClaimed = await prisma.userMysteryClaim.findFirst({
      where: { userId: user.id, nodeId: qrId }
    });
    
    if (alreadyClaimed) {
      return res.json({
        type: 'mystery',
        success: false,
        alreadyClaimed: true,
        message: "Temporal Signature Exhausted. This node has already been assimilated into your lattice."
      });
    }

    await prisma.userMysteryClaim.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        nodeId: qrId
      }
    });
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: mysteryNode.points },
        lastActivity: new Date()
      }
    });

    return res.json({
      type: 'mystery',
      success: true,
      reward: { name: mysteryNode.rewardText, points: mysteryNode.points },
      message: `Mystery Node Decrypted! ${mysteryNode.rewardText} assimilated. (+${mysteryNode.points} points)`
    });
  }

  // PRIORITY 3: Check if this is a Mystery Gift allocation (new system)
  const allocation = await prisma.gameAllocation.findUnique({
    where: { allocationId: qrId },
    include: { inventory: true }
  });

  if (allocation && allocation.gameCode === 'MG') {
    // Check if already claimed
    const existingClaim = await prisma.prizeClaim.findFirst({
      where: {
        userId: user.id,
        allocationId: allocation.allocationId
      }
    });

    if (existingClaim) {
      return res.json({
        type: 'mystery',
        success: false,
        alreadyClaimed: true,
        message: "You've already claimed this Mystery Gift!"
      });
    }

    // Check inventory
    if (allocation.inventory.quantity <= 0) {
      // Give digital fallback points
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalPoints: { increment: allocation.inventory.digitalFallbackPoints },
          lastActivity: new Date()
        }
      });

      return res.json({
        type: 'mystery',
        success: true,
        digital: true,
        reward: {
          name: `${allocation.inventory.name} (Digital)`,
          points: allocation.inventory.digitalFallbackPoints
        },
        message: `Physical prize depleted! You received ${allocation.inventory.digitalFallbackPoints} points instead.`
      });
    }

    // Decrement inventory
    await prisma.inventory.update({
      where: { id: allocation.inventoryId },
      data: { quantity: { decrement: 1 } }
    });

    // Create prize claim
    await prisma.prizeClaim.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        inventoryId: allocation.inventoryId,
        allocationId: allocation.allocationId,
        claimType: 'mystery_gift'
      }
    });

    // Award points (50 points for mystery gifts)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: 50 },
        lastActivity: new Date()
      }
    });

    return res.json({
      type: 'mystery',
      success: true,
      reward: {
        name: allocation.inventory.name,
        points: 50,
        category: allocation.category
      },
      message: `Mystery Gift Unlocked! You received: ${allocation.inventory.name} (+50 points)`
    });
  }

  return res.status(404).json({ error: "Unsupported Temporal Signal. This QR code is not part of the Hidden Chaos." });
});

// QR Status
router.get("/qr/status/:qrId", async (req, res) => {
  const { qrId } = req.params;
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const qrDef = await prisma.qrDefinition.findUnique({ where: { qrId } });
  if (!qrDef) return res.status(404).json({ error: "QR Code not found in the Chaos Lattice." });

  const config = await prisma.gameConfig.findUnique({ 
    where: { gameId: 'hidden-chaos' } 
  });
  if (!config?.isEnabled) return res.status(503).json({ error: "Zone Stabilizing Chaos..." });

  const scan = await prisma.qrScan.findFirst({
    where: { userId: user.id, qrId }
  });
  
  if (scan) {
    return res.json({ 
      status: 'completed', 
      nextClue: qrDef.nextClue,
      points: scan.points,
      prize: scan.prizeClaimed
    });
  }

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

  res.json({
    status: attemptRec.attempts >= 5 ? 'failed' : 'active',
    attempts: attemptRec.attempts,
    riddle: qrDef.riddle,
    isSolved: attemptRec.isSolved,
    nextClue: attemptRec.attempts >= 5 ? qrDef.nextClue : null
  });
});

// Submit riddle answer
router.post("/qr/submit-riddle", async (req, res) => {
  const { qrId, answer } = req.body;
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const qrDef = await prisma.qrDefinition.findUnique({ where: { qrId } });
  if (!qrDef) return res.status(404).json({ error: "QR Undefined" });

  let attemptRec = await prisma.qrRiddleAttempt.findFirst({
    where: { userId: user.id, qrId }
  });
  
  if (!attemptRec || attemptRec.attempts >= 5) {
    return res.status(403).json({ error: "Maximum attempts used." });
  }

  const isCorrect = answer?.toLowerCase().trim() === qrDef.answer.toLowerCase();
  
  const newAttempts = attemptRec.attempts + 1;
  await prisma.qrRiddleAttempt.update({
    where: { id: attemptRec.id },
    data: {
      attempts: newAttempts,
      isSolved: isCorrect
    }
  });

  if (isCorrect) {
    const globalSolvedCount = await prisma.qrScan.count({ where: { qrId } });
    
    if (globalSolvedCount === 0) {
      res.json({ 
        success: true, 
        path: 'A', 
        message: "Atomic Lock Disengaged. You are the First Visitor.",
        guaranteedPrizeId: qrDef.guaranteedPrizeId
      });
    } else {
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
      
      res.json({ 
        success: true, 
        path: 'B', 
        points, 
        nextClue: qrDef.nextClue 
      });
    }
  } else {
    if (newAttempts >= 5) {
      const points = 10;
      await prisma.qrScan.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          qrId,
          points,
          prizeClaimed: 'CONSOLATION'
        }
      });
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalPoints: { increment: points },
          lastActivity: new Date()
        }
      });
      
      res.json({ 
        success: false, 
        attemptsDepleted: true, 
        points, 
        nextClue: qrDef.nextClue 
      });
    } else {
      res.json({ success: false, attempts: newAttempts });
    }
  }
});

// Claim prize
router.post("/qr/claim-prize", async (req, res) => {
  const { qrId, mode } = req.body;
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const qrDef = await prisma.qrDefinition.findUnique({ where: { qrId } });
  if (!qrDef) return res.status(404).json({ error: "QR Undefined" });

  const alreadyClaimed = await prisma.qrScan.count({ where: { qrId } });
  if (alreadyClaimed > 0) {
    return res.status(403).json({ error: "Resource already claimed by another entity." });
  }

  let prizeType = "NOTHING";
  let points = 50;

  if (mode === 'guaranteed') {
    const item = await prisma.inventory.findUnique({ 
      where: { id: qrDef.guaranteedPrizeId! } 
    });
    
    if (item && item.quantity > 0) {
      await prisma.inventory.update({
        where: { id: item.id },
        data: { quantity: { decrement: 1 } }
      });
      prizeType = item.name;
    } else {
      points += (item?.digitalFallbackPoints || 50);
      prizeType = "FALLBACK_POINTS";
    }
  } else {
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

  await prisma.qrScan.create({
    data: {
      id: uuidv4(),
      userId: user.id,
      qrId,
      points,
      prizeClaimed: prizeType
    }
  });
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      totalPoints: { increment: points },
      lastActivity: new Date()
    }
  });

  res.json({ 
    success: true, 
    prizeType, 
    points, 
    nextClue: qrDef.nextClue 
  });
});

// Mystery scan (instant reward)
router.post("/qr/mystery-scan", async (req, res) => {
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rewards = [
    { name: "Chaotic energy", points: 50 },
    { name: "A suspicious cookie", points: 25 },
    { name: "Vibe check passed", points: 100 },
    { name: "Coffee from the ghost", points: 40 }
  ];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  await prisma.user.update({
    where: { id: user.id },
    data: {
      totalPoints: { increment: reward.points },
      lastActivity: new Date()
    }
  });
  
  res.json({ 
    success: true, 
    reward, 
    message: `You scanned a mystery code! Reward: ${reward.name} (+${reward.points} points)` 
  });
});

// === TICK TICK BOOM ===
router.get("/tick-tick-boom/status", async (req, res) => {
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  let session = await prisma.tickBoomSession.findUnique({ 
    where: { userId: user.id } 
  });
  
  if (!session) {
    session = await prisma.tickBoomSession.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        attempts: 0
      }
    });
  }
  
  const config = await prisma.gameConfig.findUnique({ 
    where: { gameId: 'tick-tick-boom' } 
  });
  
  res.json({ ...session, isEnabled: config?.isEnabled });
});

router.post("/tick-tick-boom/submit", async (req, res) => {
  const { targetTime, stopTime } = req.body;
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const configCheck = await prisma.gameConfig.findUnique({ 
    where: { gameId: 'tick-tick-boom' } 
  });
  if (configCheck && !configCheck.isEnabled) {
    return res.status(403).json({ error: "Tick Tick Boom zone is currently offline." });
  }

  const session = await prisma.tickBoomSession.findUnique({ 
    where: { userId: user.id } 
  });
  
  if (session && session.attempts >= 3) {
    return res.status(403).json({ error: "Attempts depleted. Atomic stability achieved." });
  }

  const delta = Math.abs(stopTime - targetTime);
  let points = 10;
  let result = "BOOM";

  if (delta <= 0.05) {
    points = 500;
    result = "PERFECT";
  } else if (delta <= 0.5) {
    points = Math.floor(300 - ((delta - 0.05) / 0.45) * 200);
    result = "CLOSE";
  }

  await prisma.tickBoomSession.update({
    where: { userId: user.id },
    data: {
      attempts: { increment: 1 },
      lastPlayed: new Date()
    }
  });
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      totalPoints: { increment: points },
      lastActivity: new Date()
    }
  });

  res.json({ 
    success: true, 
    points, 
    delta, 
    result, 
    attemptsLeft: 3 - (session ? session.attempts + 1 : 1) 
  });
});

export default router;

// Made with Bob
