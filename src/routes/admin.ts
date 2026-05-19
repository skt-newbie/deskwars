import { Router } from "express";
import path from "path";
import fs from "fs";
import prisma from "../db/index.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// All routes require admin
router.use(requireAdmin);

// Get admin status
router.get("/status", async (req, res) => {
  const configs = await prisma.gameConfig.findMany();
  const inventory = await prisma.inventory.findMany();
  const totalUsers = await prisma.user.count();
  const totalSubmissions = await prisma.submission.count();
  
  res.json({ 
    configs, 
    inventory, 
    stats: { totalUsers, totalSubmissions } 
  });
});

// Toggle game
router.post("/toggle-game", async (req, res) => {
  const { gameId, isEnabled } = req.body;
  await prisma.gameConfig.update({
    where: { gameId },
    data: { isEnabled }
  });
  res.json({ success: true, gameId, isEnabled });
});

// Update inventory
router.post("/update-inventory", async (req, res) => {
  const { itemId, quantity } = req.body;
  await prisma.inventory.update({
    where: { id: itemId },
    data: { quantity }
  });
  res.json({ success: true, itemId, quantity });
});

// Reset platform
router.post("/reset-platform", async (req, res) => {
  try {
    console.log('[ADMIN] Starting platform reset...');
    
    // Define initial inventory quantities (snapshot)
    const initialInventory: Record<string, number> = {
      'MND-001': 1, 'MND-002': 1, 'MND-003': 0, 'MND-004': 0, 'MND-005': 0,
      'MND-006': 1, 'MND-010': 1, 'MND-012': 1, 'MND-013': 1, 'MND-014': 1,
      'MND-016': 1, 'MND-018': 1, 'MND-022': 12, 'MND-024': 2, 'MND-026': 3,
      'MND-027': 3, 'MND-028': 3, 'MND-036': 1, 'MND-039': 1, 'MND-044': 1,
      'MND-047': 1, 'MND-049': 3, 'MND-054': 1, 'MND-057': 6
    };
    
    // Use a transaction to ensure all operations complete atomically
    await prisma.$transaction(async (tx) => {
      // Delete ALL child records first (to avoid foreign key constraint violations)
      console.log('[ADMIN] Deleting prize claims...');
      const deletedPrizeClaims = await tx.prizeClaim.deleteMany({});
      console.log(`[ADMIN] Deleted ${deletedPrizeClaims.count} prize claims`);
      
      console.log('[ADMIN] Deleting submissions...');
      const deletedSubmissions = await tx.submission.deleteMany({});
      console.log(`[ADMIN] Deleted ${deletedSubmissions.count} submissions`);
      
      console.log('[ADMIN] Deleting QR scans...');
      const deletedScans = await tx.qrScan.deleteMany({});
      console.log(`[ADMIN] Deleted ${deletedScans.count} QR scans`);
      
      console.log('[ADMIN] Deleting riddle attempts...');
      const deletedAttempts = await tx.qrRiddleAttempt.deleteMany({});
      console.log(`[ADMIN] Deleted ${deletedAttempts.count} riddle attempts`);
      
      console.log('[ADMIN] Deleting mystery claims...');
      const deletedClaims = await tx.userMysteryClaim.deleteMany({});
      console.log(`[ADMIN] Deleted ${deletedClaims.count} mystery claims`);
      
      console.log('[ADMIN] Deleting tick boom sessions...');
      const deletedSessions = await tx.tickBoomSession.deleteMany({});
      console.log(`[ADMIN] Deleted ${deletedSessions.count} tick boom sessions`);
      
      // Then delete non-admin users
      console.log('[ADMIN] Deleting non-admin users...');
      const deletedUsers = await tx.user.deleteMany({
        where: {
          AND: [
            { isAdmin: false },
            { email: { not: 'sanjayt9845524530@gmail.com' } }
          ]
        }
      });
      console.log(`[ADMIN] Deleted ${deletedUsers.count} non-admin users`);
      
      // Reset admin user points
      console.log('[ADMIN] Resetting admin points...');
      await tx.user.updateMany({
        data: { totalPoints: 0, qrHuntStep: 1 }
      });
      
      // Reset inventory quantities to initial snapshot
      console.log('[ADMIN] Restoring inventory quantities...');
      for (const [itemId, quantity] of Object.entries(initialInventory)) {
        await tx.inventory.update({
          where: { id: itemId },
          data: { quantity }
        });
      }
      console.log(`[ADMIN] Restored ${Object.keys(initialInventory).length} inventory items to initial quantities`);
    });
    
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

// Force complete a stuck submission
router.post("/force-complete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.submission.update({
      where: { id },
      data: {
        processingStatus: 'completed',
        overallScore: 50,
        aiComment: 'Submission manually completed by admin',
        categoriesJson: JSON.stringify({ placeholder: 50 })
      }
    });
    res.json({ message: 'Submission marked as completed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Populate inventory with all items
router.post("/populate-inventory", async (req, res) => {
  try {
    const inventoryData = [
      { id: 'MND-001', name: 'Ant Esports Wolf Mouse Pad', quantity: 1, digitalFallbackPoints: 104 },
      { id: 'MND-002', name: 'Portronics Toad 8 Transparent Wireless Bluetooth Mouse', quantity: 1, digitalFallbackPoints: 612 },
      { id: 'MND-003', name: 'Tygot Bluetooth Selfie Stick Tripod', quantity: 0, digitalFallbackPoints: 256 },
      { id: 'MND-004', name: 'Portronics Toad 23 Wireless Mouse', quantity: 0, digitalFallbackPoints: 269 },
      { id: 'MND-005', name: 'Portronics Swipe 2 Screen Cleaner', quantity: 0, digitalFallbackPoints: 119 },
      { id: 'MND-006', name: 'Portronics Bubble 3.0 Wireless Keyboard', quantity: 1, digitalFallbackPoints: 899 },
      { id: 'MND-010', name: 'Zebronics Transformer Gaming Mouse', quantity: 1, digitalFallbackPoints: 549 },
      { id: 'MND-013', name: 'Ambrane 60W Type-C Cable', quantity: 1, digitalFallbackPoints: 141 },
      { id: 'MND-018', name: 'Blaze Storm Soft Bullet Gun Toy', quantity: 1, digitalFallbackPoints: 174 },
      { id: 'MND-022', name: 'Fitness Mantra Sports Socks', quantity: 12, digitalFallbackPoints: 16 },
      { id: 'MND-024', name: 'Gizga Pro 3-in-1 Cleaning Kit', quantity: 2, digitalFallbackPoints: 125 },
      { id: 'MND-026', name: 'Billebon Premium Neck Pillow (Black)', quantity: 3, digitalFallbackPoints: 223 },
      { id: 'MND-027', name: 'Iris Lavender Fragrance Ceramic Vaporizer Set', quantity: 3, digitalFallbackPoints: 249 },
      { id: 'MND-028', name: 'EKAM Reed Diffuser Gift Set', quantity: 3, digitalFallbackPoints: 249 },
      { id: 'MND-049', name: 'DesiDiya Universe Crystal Ball LED Lamp', quantity: 3, digitalFallbackPoints: 179 },
      { id: 'MND-054', name: 'Quace Crystal Rain Drop String Light', quantity: 1, digitalFallbackPoints: 199 },
      { id: 'MND-057', name: 'Oral-B Pro Clean Sensitive Toothbrush', quantity: 6, digitalFallbackPoints: 50 },
    ];

    const results = [];
    for (const item of inventoryData) {
      const result = await prisma.$executeRaw`
        INSERT INTO inventory (id, name, quantity, digital_fallback_points)
        VALUES (${item.id}, ${item.name}, ${item.quantity}, ${item.digitalFallbackPoints})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          quantity = EXCLUDED.quantity,
          digital_fallback_points = EXCLUDED.digital_fallback_points
      `;
      results.push({ id: item.id, name: item.name });
    }

    res.json({
      message: 'Inventory populated successfully',
      count: results.length,
      items: results
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Migrate existing points to separate competition fields
router.post("/migrate-points", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        submissions: {
          where: {
            processingStatus: 'completed',
            submissionMode: 'final'
          }
        }
      }
    });

    const updates = [];
    for (const user of users) {
      let deskPoints = 0;
      let drawingPoints = 0;

      for (const submission of user.submissions) {
        const score = submission.overallScore || 0;
        if (submission.aiType === 'desk') {
          deskPoints += score;
        } else if (submission.aiType === 'drawing') {
          drawingPoints += score;
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          deskPoints,
          drawingPoints
        }
      });

      updates.push({ email: user.email, deskPoints, drawingPoints });
    }

    res.json({ message: 'Points migrated successfully', updates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all prize claims
router.get("/prize-claims", async (req, res) => {
  try {
    const claims = await prisma.prizeClaim.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        inventory: {
          select: {
            name: true,
            id: true
          }
        }
      },
      orderBy: {
        claimedAt: 'desc'
      }
    });

    res.json({ claims });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// Made with Bob
