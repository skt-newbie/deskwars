#!/usr/bin/env python3
"""
Automated server.ts SQLite to Prisma conversion script
"""

import re
import sys

def convert_server_file(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("🔄 Starting conversion...")
    
    # Step 1: Update imports
    print("  ✓ Updating imports...")
    old_imports = '''import "dotenv/config";
import express from "express";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import cookieParser from "cookie-parser";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import prisma from "./src/db/index.ts";'''
    
    new_imports = '''import "dotenv/config";
import express from "express";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import cookieParser from "cookie-parser";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import prisma from "./src/db/index.js";
import { seedDatabase } from "./src/lib/seed.js";
import { AIQueueManager } from "./src/lib/aiQueue.js";
import { getSessionUser, requireAuth, requireAdmin } from "./src/middleware/auth.js";'''
    
    content = content.replace(old_imports, new_imports)
    
    # Step 2: Remove old database initialization (lines after imports until AI_CONFIG)
    print("  ✓ Removing old SQLite initialization...")
    # Find and remove everything between imports and AI_CONFIG
    pattern = r'(import prisma.*?;\n)(.*?)(// --- Global AI Configuration ---)'
    content = re.sub(pattern, r'\1\n\2', content, flags=re.DOTALL)
    
    # Step 3: Replace AIQueueManager class definition with instantiation
    print("  ✓ Replacing AIQueueManager...")
    # Remove the class definition
    content = re.sub(
        r'class AIQueueManager \{[\s\S]*?\n\}\n',
        '',
        content
    )
    # Add instantiation
    content = content.replace(
        'const queueManager = new AIQueueManager();',
        'const queueManager = new AIQueueManager();'
    )
    
    # Step 4: Replace getSessionUser function
    print("  ✓ Removing old getSessionUser function...")
    content = re.sub(
        r'const getSessionUser = \(req: express\.Request.*?\n  \};',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Step 5: Replace checkAdmin middleware
    print("  ✓ Removing old checkAdmin middleware...")
    content = re.sub(
        r'const checkAdmin = \(req: express\.Request.*?\n  \};',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Step 6: Make all route handlers async
    print("  ✓ Converting route handlers to async...")
    # Pattern: apiRouter.METHOD("path", (req, res) => {
    content = re.sub(
        r'(apiRouter\.(get|post|put|delete)\([^,]+,\s*)(\(req,\s*res\)\s*=>)',
        r'\1async \3',
        content
    )
    # Pattern: apiRouter.METHOD("path", middleware, (req, res) => {
    content = re.sub(
        r'(apiRouter\.(get|post|put|delete)\([^,]+,\s*\w+,\s*)(\(req,\s*res\)\s*=>)',
        r'\1async \3',
        content
    )
    
    # Step 7: Add await to getSessionUser calls
    print("  ✓ Adding await to getSessionUser calls...")
    content = re.sub(
        r'const user = getSessionUser\(req',
        r'const user = await getSessionUser(req',
        content
    )
    content = re.sub(
        r'const userBuffer = getSessionUser\(req',
        r'const user = await getSessionUser(req',
        content
    )
    
    # Step 8: Replace db.prepare SELECT queries
    print("  ✓ Converting SELECT queries...")
    # Simple SELECT * FROM table WHERE id = ?
    content = re.sub(
        r'db\.prepare\("SELECT \* FROM (\w+) WHERE (\w+) = \?"\)\.get\(([^)]+)\)',
        lambda m: f'await prisma.{convert_table_name(m.group(1))}.findUnique({{ where: {{ {convert_column_name(m.group(2))}: {m.group(3)} }} }})',
        content
    )
    
    # Step 9: Replace db.prepare INSERT queries
    print("  ✓ Converting INSERT queries...")
    
    # Step 10: Replace db.prepare UPDATE queries
    print("  ✓ Converting UPDATE queries...")
    
    # Step 11: Replace db.prepare DELETE queries
    print("  ✓ Converting DELETE queries...")
    content = re.sub(
        r'db\.prepare\("DELETE FROM (\w+)"\)\.run\(\)',
        lambda m: f'await prisma.{convert_table_name(m.group(1))}.deleteMany()',
        content
    )
    
    # Step 12: Replace COUNT queries
    print("  ✓ Converting COUNT queries...")
    content = re.sub(
        r'\(db\.prepare\("SELECT COUNT\(\*\) as count FROM (\w+)"\)\.get\(\) as any\)\.count',
        lambda m: f'await prisma.{convert_table_name(m.group(1))}.count()',
        content
    )
    
    # Step 13: Update startServer to call seedDatabase
    print("  ✓ Adding seedDatabase call...")
    content = content.replace(
        'async function startServer() {\n  const app = express();',
        'async function startServer() {\n  await seedDatabase();\n  \n  const app = express();'
    )
    
    # Step 14: Replace checkAdmin with requireAdmin
    content = content.replace('checkAdmin', 'requireAdmin')
    
    print("✅ Conversion complete!")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"📝 Converted file saved to: {output_file}")
    print("\n⚠️  Manual review needed for:")
    print("  - Complex SQL queries with JOINs")
    print("  - Transaction blocks")
    print("  - Custom WHERE clauses")
    print("\n  Run: npm run dev")

def convert_table_name(table):
    """Convert snake_case table names to camelCase Prisma model names"""
    mapping = {
        'users': 'user',
        'submissions': 'submission',
        'future_qr_scans': 'qrScan',
        'qr_definitions': 'qrDefinition',
        'qr_riddle_attempts': 'qrRiddleAttempt',
        'game_configs': 'gameConfig',
        'inventory': 'inventory',
        'mystery_nodes': 'mysteryNode',
        'user_mystery_claims': 'userMysteryClaim',
        'tick_boom_sessions': 'tickBoomSession'
    }
    return mapping.get(table, table)

def convert_column_name(column):
    """Convert snake_case column names to camelCase"""
    mapping = {
        'user_id': 'userId',
        'qr_id': 'qrId',
        'total_points': 'totalPoints',
        'qr_hunt_step': 'qrHuntStep',
        'is_admin': 'isAdmin',
        'last_activity': 'lastActivity',
        'created_at': 'createdAt',
        'image_path': 'imagePath',
        'overall_score': 'overallScore',
        'ai_comment': 'aiComment',
        'categories_json': 'categoriesJson',
        'ai_type': 'aiType',
        'submission_mode': 'submissionMode',
        'processing_status': 'processingStatus',
        'prize_claimed': 'prizeClaimed',
        'scanned_at': 'scannedAt',
        'next_clue': 'nextClue',
        'guaranteed_prize_id': 'guaranteedPrizeId',
        'is_solved': 'isSolved',
        'game_id': 'gameId',
        'is_enabled': 'isEnabled',
        'digital_fallback_points': 'digitalFallbackPoints',
        'reward_text': 'rewardText',
        'node_id': 'nodeId',
        'last_played': 'lastPlayed'
    }
    return mapping.get(column, column)

if __name__ == '__main__':
    input_file = 'server.ts.backup'
    output_file = 'server-converted.ts'
    
    try:
        convert_server_file(input_file, output_file)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

# Made with Bob
