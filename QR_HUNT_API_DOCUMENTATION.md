# QR Hunt & Prize System API Documentation

## Overview
Complete API documentation for the QR Hunt game and Prize claiming system with inventory management.

---

## Database Schema

### Tables Created

#### 1. `game_allocations`
Maps prizes to specific games and categories.

```sql
- id: UUID (Primary Key)
- allocation_id: VARCHAR (Unique) - e.g., FP_01, CD_01, QR_01, MB_01
- game_code: VARCHAR - FP, CD, QR, MB
- game_name: VARCHAR - Full game name
- category: VARCHAR - Prize category
- reward_type: VARCHAR - Type of reward
- inventory_id: VARCHAR (Foreign Key to inventory)
```

#### 2. `prize_claims`
Tracks all prize claims by users.

```sql
- id: UUID (Primary Key)
- user_id: VARCHAR (Foreign Key to users)
- inventory_id: VARCHAR (Foreign Key to inventory)
- allocation_id: VARCHAR (Optional)
- claim_type: VARCHAR - 'qr_scan', 'mystery_box', 'game_winner'
- claimed_at: TIMESTAMP
```

#### 3. `qr_definitions` (Updated)
QR code definitions with riddles and clues.

```sql
- qr_id: VARCHAR (Primary Key)
- location: VARCHAR - Physical location
- riddle: TEXT - Riddle question
- answer: VARCHAR - Correct answer
- next_clue: TEXT - Clue for next QR
- next_qr_id: VARCHAR - Next QR code ID
- next_qr_location: VARCHAR - Next QR location
- guaranteed_prize_id: VARCHAR - Guaranteed prize for first solver
```

---

## API Endpoints

### Base URL
```
/api/qr-hunt
```

---

## 1. Scan QR Code

**Endpoint:** `GET /api/qr-hunt/scan/:qrId`

**Description:** Initial QR scan - returns riddle challenge

**Parameters:**
- `qrId` (path): QR code identifier (e.g., QR_001)

**Response (Active):**
```json
{
  "status": "active",
  "qrId": "QR_001",
  "location": "Reception (6F)",
  "riddle": "I follow you everywhere, mimic your every move...",
  "attempts": 0,
  "attemptsRemaining": 5,
  "isSolved": false
}
```

**Response (Completed):**
```json
{
  "status": "completed",
  "message": "You have already completed this QR challenge",
  "nextClue": "Find the place where chairs disappear...",
  "nextQrLocation": "Cafeteria",
  "points": 50,
  "prize": "Ant Esports GP300 Gaming Controller"
}
```

**Response (Failed):**
```json
{
  "status": "failed",
  "message": "You have used all 5 attempts",
  "attemptsRemaining": 0,
  "consolationPoints": 10,
  "nextClue": "Find the place where chairs disappear...",
  "nextQrLocation": "Cafeteria"
}
```

---

## 2. Submit Riddle Answer

**Endpoint:** `POST /api/qr-hunt/submit-riddle`

**Description:** Submit answer to riddle

**Request Body:**
```json
{
  "qrId": "QR_001",
  "answer": "shadow"
}
```

**Response (Correct - First User):**
```json
{
  "success": true,
  "correct": true,
  "isFirstUser": true,
  "message": "🎉 Brilliant! You are the FIRST to solve this riddle!",
  "riddlePoints": 50,
  "guaranteedPrizeId": "MND-020",
  "nextStep": "choose_prize"
}
```

**Response (Correct - Subsequent User):**
```json
{
  "success": true,
  "correct": true,
  "isFirstUser": false,
  "message": "✅ Correct! Riddle solved.",
  "points": 50,
  "nextClue": "Find the place where chairs disappear...",
  "nextQrLocation": "Cafeteria"
}
```

**Response (Wrong Answer - Attempts Remaining):**
```json
{
  "success": false,
  "correct": false,
  "message": "❌ Wrong answer. Try again!",
  "attempts": 1,
  "attemptsRemaining": 4
}
```

**Response (Wrong Answer - All Attempts Used):**
```json
{
  "success": false,
  "correct": false,
  "attemptsDepleted": true,
  "message": "❌ All attempts used. Here's a consolation prize.",
  "consolationPoints": 10,
  "nextClue": "Find the place where chairs disappear...",
  "nextQrLocation": "Cafeteria"
}
```

---

## 3. Claim Prize (First User Only)

**Endpoint:** `POST /api/qr-hunt/claim-prize`

**Description:** Claim prize after solving riddle (first user only)

**Request Body:**
```json
{
  "qrId": "QR_001",
  "mode": "guaranteed"  // or "randomizer"
}
```

**Response (Guaranteed Prize - Physical Available):**
```json
{
  "success": true,
  "mode": "guaranteed",
  "prize": {
    "riddlePoints": 50,
    "prizePoints": 1329,
    "prizeName": "Ant Esports GP300 Gaming Controller",
    "inventoryId": "MND-020",
    "type": "physical"
  },
  "totalPoints": 1379,
  "nextClue": "Find the place where chairs disappear...",
  "nextQrLocation": "Cafeteria"
}
```

**Response (Guaranteed Prize - Out of Stock):**
```json
{
  "success": true,
  "mode": "guaranteed",
  "prize": {
    "riddlePoints": 50,
    "prizePoints": 1329,
    "prizeName": "Ant Esports GP300 Gaming Controller (Digital Points)",
    "type": "digital_fallback"
  },
  "totalPoints": 1379,
  "nextClue": "Find the place where chairs disappear...",
  "nextQrLocation": "Cafeteria"
}
```

**Response (Randomizer - Physical Prize):**
```json
{
  "success": true,
  "mode": "randomizer",
  "prize": {
    "riddlePoints": 50,
    "prizePoints": 256,
    "prizeName": "Tygot Bluetooth Selfie Stick Tripod",
    "inventoryId": "MND-003",
    "allocationId": "QR_03",
    "category": "Main Prize QR",
    "type": "physical"
  },
  "totalPoints": 306,
  "nextClue": "Find the place where chairs disappear...",
  "nextQrLocation": "Cafeteria"
}
```

---

## 4. Mystery Gift Scan

**Endpoint:** `POST /api/qr-hunt/mystery-gift`

**Description:** Scan Mystery Gift QR (MB game allocations)

**Request Body:**
```json
{
  "allocationId": "MB_01"
}
```

**Response (Success - Physical Prize):**
```json
{
  "success": true,
  "prize": {
    "allocationId": "MB_01",
    "category": "Premium Box",
    "rewardType": "Premium Reward",
    "prizeName": "Portronics Snapcase 2 Cable Kit",
    "points": 449,
    "type": "physical"
  }
}
```

**Response (Already Claimed):**
```json
{
  "error": "You have already claimed this mystery gift",
  "alreadyClaimed": true
}
```

---

## 5. Get My Prizes

**Endpoint:** `GET /api/qr-hunt/my-prizes`

**Description:** Get all prizes claimed by the current user

**Response:**
```json
{
  "prizes": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "inventoryId": "MND-020",
      "allocationId": "QR_01",
      "claimType": "qr_scan",
      "claimedAt": "2026-05-18T23:00:00.000Z",
      "inventory": {
        "id": "MND-020",
        "name": "Ant Esports GP300 Gaming Controller",
        "quantity": 0,
        "digitalFallbackPoints": 1329
      }
    }
  ]
}
```

---

## Game Flow

### QR Hunt Game Flow

```
1. User scans QR code
   ↓
2. System shows riddle (5 attempts)
   ↓
3. User submits answer
   ↓
4a. CORRECT + FIRST USER
    → Choose: Guaranteed Prize OR Randomizer
    → Claim prize
    → Get next clue
    
4b. CORRECT + SUBSEQUENT USER
    → Auto award 50 points
    → Get next clue
    
4c. WRONG ANSWER
    → Attempts remaining? Try again
    → All attempts used? Get 10 consolation points + next clue
```

### Mystery Gift Game Flow

```
1. User scans Mystery Gift QR
   ↓
2. System checks allocation (MB_01, MB_02, etc.)
   ↓
3. Check if already claimed
   ↓
4. Award prize (physical or digital points)
   ↓
5. Update inventory and user points
```

---

## Prize Allocation Summary

### Complete the Madness (FP)
- FP_01: Gold - Ambrane MagSafe 10000mAh Power Bank
- FP_02: Silver - pTron Fusion Tunes Bluetooth Speaker
- FP_03: Bronze - Tygot Bluetooth Selfie Stick Tripod

### Desk Wars (CD)
- CD_01: Gold - Ant Esports MK3400 Mechanical Keyboard
- CD_02: Silver - Portronics Toad 8 Wireless Bluetooth Mouse
- CD_03: Bronze - SaleOn Tech Pouch Organizer

### Scan and Survive (QR)
- 15 QR codes with various prizes
- Main Prize QRs: 3 items
- Small Reward QRs: 5 items
- Dummy QRs: 6 items
- Chaos QR: 1 item

### Mystery Gifts (MB)
- 10 mystery boxes
- Premium Boxes: 3 items
- Useful/Fun Gifts: 3 items
- Funny/Dummy Boxes: 4 items

---

## Points System

| Action | Points |
|--------|--------|
| Solve riddle (subsequent users) | 50 |
| Solve riddle + guaranteed prize | 50 + prize value |
| Solve riddle + randomizer prize | 50 + prize value |
| Fail riddle (consolation) | 10 |
| Mystery gift scan | Prize value |

---

## Error Codes

| Code | Message |
|------|---------|
| 401 | Unauthorized - User not logged in |
| 400 | Bad Request - Invalid parameters |
| 403 | Forbidden - Already claimed or max attempts |
| 404 | Not Found - QR code or prize not found |
| 500 | Internal Server Error |

---

## Database Queries

### Check Prize Availability
```sql
SELECT quantity FROM inventory WHERE id = 'MND-020';
```

### Get User's Claimed Prizes
```sql
SELECT * FROM prize_claims 
WHERE user_id = 'user-uuid' 
ORDER BY claimed_at DESC;
```

### Get QR Allocations
```sql
SELECT * FROM game_allocations 
WHERE game_code = 'QR' 
AND inventory_id IN (
  SELECT id FROM inventory WHERE quantity > 0
);
```

### Check if User Solved Riddle
```sql
SELECT * FROM qr_riddle_attempts 
WHERE user_id = 'user-uuid' 
AND qr_id = 'QR_001' 
AND is_solved = true;
```

---

## Integration Notes

1. **Server Setup**: Add route to server.ts
```typescript
import qrHuntRouter from './routes/qr-hunt.js';
app.use('/api/qr-hunt', qrHuntRouter);
```

2. **Authentication**: All endpoints require user authentication via `getSessionUser`

3. **Inventory Management**: Quantities automatically decremented on prize claim

4. **Points**: User points automatically updated on prize claim

5. **Idempotency**: Users cannot claim same prize twice (checked via prize_claims table)

---

## Testing Checklist

- [ ] Scan QR code (first time)
- [ ] Submit correct answer (first user)
- [ ] Choose guaranteed prize
- [ ] Choose randomizer prize
- [ ] Submit correct answer (subsequent user)
- [ ] Submit wrong answer (with attempts remaining)
- [ ] Submit wrong answer (all attempts used)
- [ ] Scan already completed QR
- [ ] Scan mystery gift QR
- [ ] Try to claim same mystery gift twice
- [ ] Check inventory quantity updates
- [ ] Check user points updates
- [ ] Verify prize_claims records

---

Made with ❤️ by Bob