import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const db = new Database('deskwars.db');

interface User {
  id: string;
  username: string;
  email: string | null;
  total_points: number;
  qr_hunt_step: number;
  is_admin: number;
  last_activity: string | null;
  created_at: string;
}

interface Submission {
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
}

interface QrScan {
  id: string;
  user_id: string;
  qr_id: string;
  points: number;
  prize_claimed: string | null;
  scanned_at: string;
}

interface QrDefinition {
  qr_id: string;
  riddle: string;
  answer: string;
  next_clue: string;
  guaranteed_prize_id: string | null;
}

interface QrRiddleAttempt {
  id: string;
  user_id: string;
  qr_id: string;
  attempts: number;
  is_solved: number;
}

console.log('Exporting SQLite data...\n');

// Export Users
const users = db.prepare('SELECT * FROM users').all() as User[];
console.log(`✓ Exported ${users.length} users`);

// Export Submissions
const submissions = db.prepare('SELECT * FROM submissions').all() as Submission[];
console.log(`✓ Exported ${submissions.length} submissions`);

// Export QR Scans
const qrScans = db.prepare('SELECT * FROM future_qr_scans').all() as QrScan[];
console.log(`✓ Exported ${qrScans.length} QR scans`);

// Export QR Definitions
let qrDefinitions: QrDefinition[] = [];
try {
  qrDefinitions = db.prepare('SELECT * FROM qr_definitions').all() as QrDefinition[];
  console.log(`✓ Exported ${qrDefinitions.length} QR definitions`);
} catch (e) {
  console.log('⚠ QR definitions table not found (optional)');
}

// Export QR Riddle Attempts
let qrRiddleAttempts: QrRiddleAttempt[] = [];
try {
  qrRiddleAttempts = db.prepare('SELECT * FROM qr_riddle_attempts').all() as QrRiddleAttempt[];
  console.log(`✓ Exported ${qrRiddleAttempts.length} QR riddle attempts`);
} catch (e) {
  console.log('⚠ QR riddle attempts table not found (optional)');
}

// Create export data
const exportData = {
  users,
  submissions,
  qrScans,
  qrDefinitions,
  qrRiddleAttempts,
  exportedAt: new Date().toISOString(),
};

// Write to JSON file
const exportPath = path.join(process.cwd(), 'sqlite-export.json');
fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

console.log(`\n✅ Data exported to: ${exportPath}`);
console.log('\nNext steps:');
console.log('1. Set up PostgreSQL database');
console.log('2. Update DATABASE_URL in .env');
console.log('3. Run: npx prisma migrate dev --name init');
console.log('4. Run: npx tsx scripts/import-to-postgres.ts');

db.close();

// Made with Bob
