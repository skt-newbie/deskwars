import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import prisma from "../db/index.js";
import { getSessionUser } from "../middleware/auth.js";

const router = Router();

// Login/Register
router.post("/login", async (req, res) => {
  const rawEmail = req.body.email;
  if (!rawEmail) return res.status(400).json({ error: "Email required" });

  const email = rawEmail.toLowerCase().trim();

  const isIbmEmail = email.endsWith('@ibm.com');
  const isAdminEmail = email === 'sanjayt9845524530@gmail.com';

  if (!isIbmEmail && !isAdminEmail) {
    return res.status(403).json({ error: "Unauthorized access: Only IBM identities are permitted in this sector." });
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const id = uuidv4();
    const defaultUsername = email.split('@')[0];
    const isAdmin = (email.startsWith('admin') || email === 'sanjayt9845524530@gmail.com');
    user = await prisma.user.create({
      data: {
        id,
        username: defaultUsername,
        email,
        totalPoints: 0,
        isAdmin
      }
    });
  } else {
    const shouldBeAdmin = (email.startsWith('admin') || email === 'sanjayt9845524530@gmail.com');
    if (shouldBeAdmin && !user.isAdmin) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isAdmin: true }
      });
    }
  }

  res.cookie("userId", user.id, { 
    maxAge: 30 * 24 * 60 * 60 * 1000, 
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  });
  
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActivity: new Date() }
  });
  
  res.json(user);
});

// Get current user
router.get("/me", async (req, res) => {
  const user = await getSessionUser(req, res);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json(user);
});

export default router;

// Made with Bob
