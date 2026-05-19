# Server.ts Prisma Conversion Guide

## Quick Conversion Reference

Your server.ts file needs these systematic changes to work with Prisma + PostgreSQL:

### 1. Remove SQLite Database Initialization (Lines 12-86)
**DELETE** all the `db.exec()` and `db.prepare()` seed code.

### 2. Import New Modules at Top
```typescript
import { seedDatabase } from "./src/lib/seed.js";
import { AIQueueManager } from "./src/lib/aiQueue.js";
import { getSessionUser, requireAuth, requireAdmin } from "./src/middleware/auth.js";
```

### 3. Replace All `db.prepare()` Calls

#### Pattern 1: SELECT queries
```typescript
// OLD:
const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

// NEW:
const user = await prisma.user.findUnique({ where: { id: userId } });
```

#### Pattern 2: INSERT queries
```typescript
// OLD:
db.prepare("INSERT INTO users (id, username, email) VALUES (?, ?, ?)").run(id, username, email);

// NEW:
await prisma.user.create({
  data: { id, username, email }
});
```

#### Pattern 3: UPDATE queries
```typescript
// OLD:
db.prepare("UPDATE users SET total_points = total_points + ? WHERE id = ?").run(points, userId);

// NEW:
await prisma.user.update({
  where: { id: userId },
  data: { totalPoints: { increment: points } }
});
```

#### Pattern 4: DELETE queries
```typescript
// OLD:
db.prepare("DELETE FROM submissions").run();

// NEW:
await prisma.submission.deleteMany();
```

#### Pattern 5: COUNT queries
```typescript
// OLD:
const count = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;

// NEW:
const count = await prisma.user.count();
```

### 4. Table Name Mappings
- `users` → `prisma.user`
- `submissions` → `prisma.submission`
- `future_qr_scans` → `prisma.qrScan`
- `qr_definitions` → `prisma.qrDefinition`
- `qr_riddle_attempts` → `prisma.qrRiddleAttempt`
- `game_configs` → `prisma.gameConfig`
- `inventory` → `prisma.inventory`
- `mystery_nodes` → `prisma.mysteryNode`
- `user_mystery_claims` → `prisma.userMysteryClaim`
- `tick_boom_sessions` → `prisma.tickBoomSession`

### 5. Column Name Mappings (snake_case → camelCase)
- `user_id` → `userId`
- `qr_id` → `qrId`
- `total_points` → `totalPoints`
- `qr_hunt_step` → `qrHuntStep`
- `is_admin` → `isAdmin`
- `last_activity` → `lastActivity`
- `created_at` → `createdAt`
- `image_path` → `imagePath`
- `overall_score` → `overallScore`
- `ai_comment` → `aiComment`
- `categories_json` → `categoriesJson`
- `ai_type` → `aiType`
- `submission_mode` → `submissionMode`
- `processing_status` → `processingStatus`
- `prize_claimed` → `prizeClaimed`
- `scanned_at` → `scannedAt`
- `next_clue` → `nextClue`
- `guaranteed_prize_id` → `guaranteedPrizeId`
- `is_solved` → `isSolved`
- `game_id` → `gameId`
- `is_enabled` → `isEnabled`
- `digital_fallback_points` → `digitalFallbackPoints`
- `reward_text` → `rewardText`
- `node_id` → `nodeId`
- `last_played` → `lastPlayed`

### 6. Make All Route Handlers Async
Every route handler that accesses the database must be `async`:
```typescript
// OLD:
apiRouter.get("/auth/me", (req, res) => {
  const user = getSessionUser(req, res);
  // ...
});

// NEW:
apiRouter.get("/auth/me", async (req, res) => {
  const user = await getSessionUser(req, res);
  // ...
});
```

### 7. Replace Transactions
```typescript
// OLD:
db.transaction(() => {
  db.prepare("INSERT ...").run();
  db.prepare("UPDATE ...").run();
})();

// NEW:
await prisma.$transaction([
  prisma.table.create({ data: {...} }),
  prisma.table.update({ where: {...}, data: {...} })
]);
```

### 8. Update startServer() Function
```typescript
async function startServer() {
  // Seed database on startup
  await seedDatabase();
  
  const app = express();
  // ... rest of setup
}
```

## Automated Conversion Script

Run this to help identify all locations that need changes:

```bash
# Find all db.prepare calls
grep -n "db\.prepare" server.ts

# Find all getSessionUser calls (need await)
grep -n "getSessionUser" server.ts

# Find all non-async route handlers
grep -n "apiRouter\.\(get\|post\|put\|delete\).*(" server.ts
```

## Testing Checklist

After conversion:
- [ ] All routes are async
- [ ] All database calls use await
- [ ] All table names use camelCase
- [ ] All column names use camelCase
- [ ] Seed function is called on startup
- [ ] AIQueueManager is imported and used
- [ ] Auth middleware is imported
- [ ] Test with `npm run dev`