import { Router } from "express";
import prisma from "../db/index.js";

const router = Router();

// Leaderboard
router.get("/", async (req, res) => {
  const { category } = req.query;
  
  // Total Points Leaderboard (Combined)
  if (category === 'total') {
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        totalPoints: { gt: 0 }
      },
      orderBy: { totalPoints: 'desc' },
      take: 10,
      select: {
        email: true,
        username: true,
        totalPoints: true,
        deskPoints: true,
        drawingPoints: true,
        lastActivity: true
      }
    });
    
    const formatted = users.map(u => ({
      display_name: u.email,
      email: u.email,
      username: u.username,
      score: u.totalPoints,
      desk_points: u.deskPoints,
      drawing_points: u.drawingPoints,
      last_activity: u.lastActivity
    }));
    
    return res.json(formatted);
  }

  // Desk Wars Leaderboard
  if (category === 'desk') {
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        deskPoints: { gt: 0 }
      },
      orderBy: { deskPoints: 'desc' },
      take: 10,
      select: {
        email: true,
        username: true,
        deskPoints: true,
        lastActivity: true
      }
    });
    
    const formatted = users.map(u => ({
      display_name: u.email,
      email: u.email,
      username: u.username,
      score: u.deskPoints,
      last_activity: u.lastActivity
    }));
    
    return res.json(formatted);
  }

  // Finish the Madness (Drawing) Leaderboard
  if (category === 'drawing') {
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
        drawingPoints: { gt: 0 }
      },
      orderBy: { drawingPoints: 'desc' },
      take: 10,
      select: {
        email: true,
        username: true,
        drawingPoints: true,
        lastActivity: true
      }
    });
    
    const formatted = users.map(u => ({
      display_name: u.email,
      email: u.email,
      username: u.username,
      score: u.drawingPoints,
      last_activity: u.lastActivity
    }));
    
    return res.json(formatted);
  }

  // Default: Desk Wars
  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      deskPoints: { gt: 0 }
    },
    orderBy: { deskPoints: 'desc' },
    take: 10,
    select: {
      email: true,
      username: true,
      deskPoints: true,
      lastActivity: true
    }
  });
  
  const formatted = users.map(u => ({
    display_name: u.email,
    email: u.email,
    username: u.username,
    score: u.deskPoints,
    last_activity: u.lastActivity
  }));
  
  res.json(formatted);
});

// Latest submissions feed
router.get("/feed", async (req, res) => {
  const submissions = await prisma.submission.findMany({
    where: { processingStatus: 'completed' },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  
  const formatted = submissions.map(s => ({
    ...s,
    username: s.user.email
  }));
  
  res.json(formatted);
});

export default router;

// Made with Bob
