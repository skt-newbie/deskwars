# Prisma Conversion Reference

Quick reference for converting SQLite queries to Prisma.

## Common Patterns

### SELECT Queries

**SQLite:**
```typescript
const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
```

**Prisma:**
```typescript
const user = await prisma.user.findUnique({ where: { id: userId } });
```

### INSERT Queries

**SQLite:**
```typescript
db.prepare("INSERT INTO users (id, username, email) VALUES (?, ?, ?)").run(id, username, email);
```

**Prisma:**
```typescript
await prisma.user.create({
  data: { id, username, email }
});
```

### UPDATE Queries

**SQLite:**
```typescript
db.prepare("UPDATE users SET total_points = total_points + ? WHERE id = ?").run(points, userId);
```

**Prisma:**
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { totalPoints: { increment: points } }
});
```

### DELETE Queries

**SQLite:**
```typescript
db.prepare("DELETE FROM users WHERE is_admin = 0").run();
```

**Prisma:**
```typescript
await prisma.user.deleteMany({
  where: { isAdmin: false }
});
```

### COUNT Queries

**SQLite:**
```typescript
const count = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
```

**Prisma:**
```typescript
const count = await prisma.user.count();
```

### Transactions

**SQLite:**
```typescript
db.transaction(() => {
  db.prepare("INSERT...").run();
  db.prepare("UPDATE...").run();
})();
```

**Prisma:**
```typescript
await prisma.$transaction([
  prisma.user.create({...}),
  prisma.user.update({...})
]);
```

### INSERT OR IGNORE

**SQLite:**
```typescript
db.prepare("INSERT OR IGNORE INTO table (id, name) VALUES (?, ?)").run(id, name);
```

**Prisma:**
```typescript
await prisma.table.upsert({
  where: { id },
  update: {},
  create: { id, name }
});
```

## Key Differences

1. **All Prisma queries are async** - Add `await` and make functions `async`
2. **No raw SQL** - Use Prisma's query builder
3. **Type-safe** - TypeScript knows your schema
4. **camelCase** - Field names are camelCase in Prisma (e.g., `total_points` → `totalPoints`)