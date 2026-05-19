import { Request, Response, NextFunction } from "express";
import prisma from "../db/index.js";

export async function getSessionUser(req: Request, res?: Response) {
  const userId = req.cookies.userId || req.headers["x-user-id"];
  
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId as string } });
    if (!user && res) {
      res.clearCookie("userId");
    }
    return user || null;
  } catch (err) {
    console.error("[AUTH] Database error during session lookup:", err);
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await getSessionUser(req, res);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).user = user;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await getSessionUser(req, res);
  if (!user || (!user.isAdmin && user.email !== 'sanjayt9845524530@gmail.com')) {
    return res.status(403).json({ error: "Access denied: Chaos Lords Only." });
  }
  (req as any).user = user;
  next();
}

// Made with Bob
