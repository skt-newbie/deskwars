# Next Steps - QR Hunt & Prize System Implementation

## ✅ Completed

1. ✅ Updated inventory system with total quantities
2. ✅ Created game allocation tables (31 allocations)
3. ✅ Created prize claims tracking table
4. ✅ Updated QR definitions with 15 riddles and clues
5. ✅ Implemented QR scanning logic with riddle validation
6. ✅ Implemented prize claiming (guaranteed vs randomizer)
7. ✅ Inventory quantity auto-decrements on claim
8. ✅ Generated Prisma Client
9. ✅ Added QR Hunt route to server.ts
10. ✅ Created comprehensive API documentation

---

## 🚀 Next Steps

### 1. Test the API Endpoints

Start the server and test each endpoint:

```bash
npm run dev
```

#### Test Checklist:

**QR Hunt Flow:**
```bash
# 1. Scan QR code
GET http://localhost:3000/api/qr-hunt/scan/QR_001

# 2. Submit correct answer (first user)
POST http://localhost:3000/api/qr-hunt/submit-riddle
{
  "qrId": "QR_001",
  "answer": "shadow"
}

# 3. Claim prize (guaranteed)
POST http://localhost:3000/api/qr-hunt/claim-prize
{
  "qrId": "QR_001",
  "mode": "guaranteed"
}

# 4. Claim prize (randomizer)
POST http://localhost:3000/api/qr-hunt/claim-prize
{
  "qrId": "QR_002",
  "mode": "randomizer"
}

# 5. Get my prizes
GET http://localhost:3000/api/qr-hunt/my-prizes
```

**Mystery Gift Flow:**
```bash
# Scan mystery gift
POST http://localhost:3000/api/qr-hunt/mystery-gift
{
  "allocationId": "MB_01"
}
```

---

### 2. Create Frontend Components

#### A. QR Scanner Page

Create `src/pages/QRScannerPage.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function QRScannerPage() {
  const [qrId, setQrId] = useState('');
  const [riddleData, setRiddleData] = useState(null);
  const [answer, setAnswer] = useState('');
  const navigate = useNavigate();

  const handleScan = async () => {
    const res = await fetch(`/api/qr-hunt/scan/${qrId}`);
    const data = await res.json();
    setRiddleData(data);
  };

  const handleSubmitAnswer = async () => {
    const res = await fetch('/api/qr-hunt/submit-riddle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrId, answer })
    });
    const data = await res.json();
    
    if (data.isFirstUser) {
      // Show prize choice modal
      navigate(`/qr-hunt/claim-prize/${qrId}`);
    } else if (data.correct) {
      // Show success and next clue
      alert(`Correct! +${data.points} points. Next: ${data.nextClue}`);
    }
  };

  return (
    <div className="qr-scanner-page">
      <h1>QR Hunt</h1>
      
      {/* QR Input */}
      <input 
        value={qrId} 
        onChange={(e) => setQrId(e.target.value)}
        placeholder="Enter QR Code (e.g., QR_001)"
      />
      <button onClick={handleScan}>Scan QR</button>

      {/* Riddle Display */}
      {riddleData && (
        <div className="riddle-section">
          <h2>Riddle Challenge</h2>
          <p>{riddleData.riddle}</p>
          <p>Attempts: {riddleData.attempts}/5</p>
          
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer"
          />
          <button onClick={handleSubmitAnswer}>Submit Answer</button>
        </div>
      )}
    </div>
  );
}
```

#### B. Prize Claim Page

Create `src/pages/PrizeClaimPage.tsx`:

```typescript
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function PrizeClaimPage() {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async (mode: 'guaranteed' | 'randomizer') => {
    setClaiming(true);
    const res = await fetch('/api/qr-hunt/claim-prize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrId, mode })
    });
    const data = await res.json();
    
    // Show prize result
    alert(`You won: ${data.prize.prizeName}! +${data.totalPoints} points`);
    navigate('/qr-hunt');
  };

  return (
    <div className="prize-claim-page">
      <h1>🎉 You're the First!</h1>
      <p>Choose your prize:</p>
      
      <div className="prize-options">
        <button onClick={() => handleClaim('guaranteed')}>
          <h3>Guaranteed Prize</h3>
          <p>Safe choice - get the guaranteed item</p>
        </button>
        
        <button onClick={() => handleClaim('randomizer')}>
          <h3>Randomizer</h3>
          <p>Risk it! Random prize from QR pool</p>
        </button>
      </div>
    </div>
  );
}
```

#### C. My Prizes Page

Create `src/pages/MyPrizesPage.tsx`:

```typescript
import { useEffect, useState } from 'react';

export default function MyPrizesPage() {
  const [prizes, setPrizes] = useState([]);

  useEffect(() => {
    fetch('/api/qr-hunt/my-prizes')
      .then(res => res.json())
      .then(data => setPrizes(data.prizes));
  }, []);

  return (
    <div className="my-prizes-page">
      <h1>My Prizes</h1>
      
      <div className="prizes-list">
        {prizes.map(prize => (
          <div key={prize.id} className="prize-card">
            <h3>{prize.inventory.name}</h3>
            <p>Type: {prize.claimType}</p>
            <p>Claimed: {new Date(prize.claimedAt).toLocaleString()}</p>
            <p>Points: {prize.inventory.digitalFallbackPoints}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 3. Add Routes to App

Update `src/App.tsx`:

```typescript
import QRScannerPage from './pages/QRScannerPage';
import PrizeClaimPage from './pages/PrizeClaimPage';
import MyPrizesPage from './pages/MyPrizesPage';

// Add to routes:
<Route path="/qr-hunt" element={<QRScannerPage />} />
<Route path="/qr-hunt/claim-prize/:qrId" element={<PrizeClaimPage />} />
<Route path="/my-prizes" element={<MyPrizesPage />} />
```

---

### 4. Update Navigation

Add QR Hunt links to `src/components/Navigation.tsx`:

```typescript
<Link to="/qr-hunt">QR Hunt</Link>
<Link to="/my-prizes">My Prizes</Link>
```

---

### 5. Generate QR Codes

Create physical QR codes for each location:

```bash
# Use a QR code generator to create codes for:
QR_001 → https://your-domain.com/qr-hunt?id=QR_001
QR_002 → https://your-domain.com/qr-hunt?id=QR_002
...
QR_015 → https://your-domain.com/qr-hunt?id=QR_015

# Mystery Gifts:
MB_01 → https://your-domain.com/mystery-gift?id=MB_01
MB_02 → https://your-domain.com/mystery-gift?id=MB_02
...
MB_10 → https://your-domain.com/mystery-gift?id=MB_10
```

**QR Code Locations:**
- QR_001: Reception (6F)
- QR_002: Dustbin (6F)
- QR_003: TV Area (5F)
- QR_004: TV Area (6F)
- QR_005: Vending Machine / Bookshelf (5F)
- QR_006: Wall of Glory (5F)
- QR_007: Wall of Glory (6F)
- QR_008: 6th Floor Random Cupboards
- QR_009: Washrooms Hidden Spot #1
- QR_010: Washrooms Hidden Spot #2
- QR_011: Cafeteria
- QR_012: Library (6F)
- QR_013: Outside — No Name Area
- QR_014: Standing Desk #1
- QR_015: Standing Desk #2

---

### 6. Admin Panel Updates

Add inventory management to admin panel:

```typescript
// In AdminPanel.tsx

const [inventory, setInventory] = useState([]);

useEffect(() => {
  fetch('/api/admin/dashboard')
    .then(res => res.json())
    .then(data => setInventory(data.inventory));
}, []);

// Display inventory with quantities
<div className="inventory-section">
  <h2>Inventory Status</h2>
  {inventory.map(item => (
    <div key={item.id}>
      <span>{item.name}</span>
      <span>Qty: {item.quantity}</span>
      <span>Points: {item.digitalFallbackPoints}</span>
    </div>
  ))}
</div>
```

---

### 7. Testing Scenarios

#### Scenario 1: First User Flow
1. User scans QR_001
2. Sees riddle: "I follow you everywhere..."
3. Submits answer: "shadow"
4. Gets choice: Guaranteed or Randomizer
5. Chooses Guaranteed
6. Receives: Ant Esports GP300 Gaming Controller
7. Gets next clue

#### Scenario 2: Subsequent User Flow
1. User scans QR_001 (already solved by someone)
2. Sees riddle
3. Submits correct answer
4. Auto-receives 50 points
5. Gets next clue

#### Scenario 3: Failed Riddle
1. User scans QR_002
2. Submits wrong answer 5 times
3. Receives 10 consolation points
4. Gets next clue anyway

#### Scenario 4: Mystery Gift
1. User scans MB_01 QR
2. Instantly receives: Portronics Snapcase 2 Cable Kit
3. Points added to account

---

### 8. Database Monitoring

Monitor the database:

```bash
# Check inventory quantities
docker exec deskwars-postgres psql -U postgres -d deskwars -c "SELECT id, name, quantity FROM inventory WHERE quantity > 0;"

# Check prize claims
docker exec deskwars-postgres psql -U postgres -d deskwars -c "SELECT COUNT(*), claim_type FROM prize_claims GROUP BY claim_type;"

# Check QR scan status
docker exec deskwars-postgres psql -U postgres -d deskwars -c "SELECT qr_id, COUNT(*) as scans FROM future_qr_scans GROUP BY qr_id;"
```

---

### 9. Production Checklist

Before going live:

- [ ] Test all API endpoints
- [ ] Verify inventory quantities are correct
- [ ] Test prize claiming flow
- [ ] Test randomizer selection
- [ ] Verify points are updating correctly
- [ ] Test duplicate claim prevention
- [ ] Generate and print all QR codes
- [ ] Place QR codes in correct locations
- [ ] Test with multiple users
- [ ] Set up monitoring/logging
- [ ] Backup database before event

---

### 10. Event Day Operations

**Before Event:**
1. Verify all QR codes are in place
2. Check database connectivity
3. Test a few QR scans
4. Ensure inventory is fully stocked

**During Event:**
1. Monitor prize claims in real-time
2. Watch for inventory depletion
3. Track user engagement
4. Be ready to troubleshoot

**After Event:**
1. Export prize claims data
2. Generate winner reports
3. Backup final database state
4. Analyze game statistics

---

## 📊 Useful Queries

```sql
-- Top prize winners
SELECT u.username, COUNT(pc.id) as prizes_won
FROM users u
JOIN prize_claims pc ON u.id = pc.user_id
GROUP BY u.username
ORDER BY prizes_won DESC
LIMIT 10;

-- Most popular prizes
SELECT i.name, COUNT(pc.id) as times_claimed
FROM inventory i
JOIN prize_claims pc ON i.id = pc.inventory_id
GROUP BY i.name
ORDER BY times_claimed DESC;

-- QR completion rate
SELECT 
  COUNT(DISTINCT qr_id) as total_qrs,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_scans
FROM future_qr_scans;
```

---

## 🎯 Success Metrics

Track these metrics:
- Total QR scans
- Riddle solve rate
- Average attempts per riddle
- Guaranteed vs Randomizer choice ratio
- Prize claim distribution
- User engagement (scans per user)
- Inventory depletion rate

---

## 🐛 Troubleshooting

**Issue: TypeScript errors**
- Solution: Run `npx prisma generate` to regenerate Prisma Client

**Issue: Inventory not updating**
- Check: Prize claims table for duplicate entries
- Verify: Inventory quantity > 0 before claim

**Issue: User can't claim prize**
- Check: User authentication
- Verify: Riddle was solved (is_solved = true)
- Check: Prize not already claimed

**Issue: Randomizer not working**
- Verify: QR allocations exist in game_allocations table
- Check: At least one item has quantity > 0

---

## 📚 Documentation

- **API Documentation**: `QR_HUNT_API_DOCUMENTATION.md`
- **Inventory**: `INVENTORY.md`
- **Database Schema**: `prisma/schema.prisma`
- **This Guide**: `NEXT_STEPS.md`

---

## 🎉 You're Ready!

All backend systems are in place. The next steps are:
1. Test the API endpoints
2. Build the frontend components
3. Generate and place QR codes
4. Run a test event
5. Go live!

Good luck with your Deskwars carnival event! 🚀

---

Made with ❤️ by Bob