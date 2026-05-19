import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ExportData {
  users: Array<{
    id: string;
    username: string;
    email: string | null;
    total_points: number;
    qr_hunt_step: number;
    is_admin: number;
    last_activity: string | null;
    created_at: string;
  }>;
  submissions: Array<{
    id: string;
    user_id: string;
    image_path: string;
    overall_score: number | null;
    ai_comment: string | null;
    categories_json: string | null;
    ai_type: string;
    submission_mode: string;
    processing_status: string;
    created_at: string;
  }>;
  qrScans: Array<{
    id: string;
    user_id: string;
    qr_id: string;
    points: number;
    prize_claimed: string | null;
    scanned_at: string;
  }>;
  qrDefinitions: Array<{
    qr_id: string;
    riddle: string;
    answer: string;
    next_clue: string;
    guaranteed_prize_id: string | null;
  }>;
  qrRiddleAttempts: Array<{
    id: string;
    user_id: string;
    qr_id: string;
    attempts: number;
    is_solved: number;
  }>;
}

async function importData() {
  console.log('Starting PostgreSQL import...\n');

  // Read exported data
  const exportPath = path.join(process.cwd(), 'sqlite-export.json');
  if (!fs.existsSync(exportPath)) {
    console.error('❌ sqlite-export.json not found!');
    console.error('Run: npx tsx scripts/export-sqlite-data.ts first');
    process.exit(1);
  }

  const data: ExportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

  try {
    // Import Users
    console.log(`Importing ${data.users.length} users...`);
    for (const user of data.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          totalPoints: user.total_points,
          qrHuntStep: user.qr_hunt_step,
          isAdmin: user.is_admin === 1,
          lastActivity: user.last_activity ? new Date(user.last_activity) : null,
          createdAt: new Date(user.created_at),
        },
      });
    }
    console.log('✓ Users imported\n');

    // Import Submissions
    console.log(`Importing ${data.submissions.length} submissions...`);
    for (const submission of data.submissions) {
      await prisma.submission.create({
        data: {
          id: submission.id,
          userId: submission.user_id,
          imagePath: submission.image_path,
          overallScore: submission.overall_score,
          aiComment: submission.ai_comment,
          categoriesJson: submission.categories_json,
          aiType: submission.ai_type,
          submissionMode: submission.submission_mode,
          processingStatus: submission.processing_status,
          createdAt: new Date(submission.created_at),
        },
      });
    }
    console.log('✓ Submissions imported\n');

    // Import QR Scans
    console.log(`Importing ${data.qrScans.length} QR scans...`);
    for (const scan of data.qrScans) {
      await prisma.qrScan.create({
        data: {
          id: scan.id,
          userId: scan.user_id,
          qrId: scan.qr_id,
          points: scan.points,
          prizeClaimed: scan.prize_claimed,
          scannedAt: new Date(scan.scanned_at),
        },
      });
    }
    console.log('✓ QR scans imported\n');

    // Import QR Definitions
    if (data.qrDefinitions.length > 0) {
      console.log(`Importing ${data.qrDefinitions.length} QR definitions...`);
      for (const def of data.qrDefinitions) {
        await prisma.qrDefinition.create({
          data: {
            qrId: def.qr_id,
            riddle: def.riddle,
            answer: def.answer,
            nextClue: def.next_clue,
            guaranteedPrizeId: def.guaranteed_prize_id,
          },
        });
      }
      console.log('✓ QR definitions imported\n');
    }

    // Import QR Riddle Attempts
    if (data.qrRiddleAttempts.length > 0) {
      console.log(`Importing ${data.qrRiddleAttempts.length} QR riddle attempts...`);
      for (const attempt of data.qrRiddleAttempts) {
        await prisma.qrRiddleAttempt.create({
          data: {
            id: attempt.id,
            userId: attempt.user_id,
            qrId: attempt.qr_id,
            attempts: attempt.attempts,
            isSolved: attempt.is_solved === 1,
          },
        });
      }
      console.log('✓ QR riddle attempts imported\n');
    }

    console.log('✅ All data imported successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importData();

// Made with Bob
