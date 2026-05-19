# PostgreSQL Migration Guide

This guide will help you migrate from SQLite to PostgreSQL for production deployment with 200+ concurrent users.

## Prerequisites

- Node.js installed
- PostgreSQL database (local or cloud)
- Existing SQLite database with data

## Step-by-Step Migration

### 1. Set Up PostgreSQL Database

Choose one of these options:

#### Option A: Local PostgreSQL (Development/Testing)
```bash
# Install PostgreSQL locally
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
psql -U postgres
CREATE DATABASE deskwars;
\q
```

#### Option B: Cloud PostgreSQL (Production - Recommended)

**Supabase (Free tier available):**
1. Go to https://supabase.com
2. Create new project
3. Copy connection string from Settings > Database

**Neon (Serverless Postgres):**
1. Go to https://neon.tech
2. Create new project
3. Copy connection string

**Google Cloud SQL:**
```bash
gcloud sql instances create deskwars-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and update DATABASE_URL
# Example: DATABASE_URL="postgresql://user:password@host:5432/deskwars"
```

### 3. Export Existing SQLite Data

```bash
# Export all data from SQLite to JSON
npx tsx scripts/export-sqlite-data.ts
```

This creates `sqlite-export.json` with all your existing data.

### 4. Generate Prisma Client

```bash
# Generate Prisma client from schema
npx prisma generate
```

### 5. Create Database Schema

```bash
# Create tables in PostgreSQL
npx prisma migrate dev --name init
```

This will:
- Create all tables based on `prisma/schema.prisma`
- Generate migration files in `prisma/migrations/`

### 6. Import Data to PostgreSQL

```bash
# Import data from sqlite-export.json to PostgreSQL
npx tsx scripts/import-to-postgres.ts
```

### 7. Update Server Code

The server code has been updated to use Prisma. Key changes:

- `src/db/index.ts` - Now exports Prisma client instead of better-sqlite3
- All database queries need to be updated to use Prisma syntax

### 8. Update Server.ts (Manual Step Required)

You'll need to update `server.ts` to use Prisma queries instead of raw SQL. Example conversions:

**Before (SQLite):**
```typescript
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
```

**After (Prisma):**
```typescript
const user = await prisma.user.findUnique({ where: { id: userId } });
```

**Before (SQLite):**
```typescript
db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run(id, username);
```

**After (Prisma):**
```typescript
await prisma.user.create({ data: { id, username } });
```

### 9. Test the Migration

```bash
# Build the application
npm run build

# Start production server
npm start

# Test endpoints
curl http://localhost:5000/api/health
```

### 10. Deploy to Production

Update your deployment configuration:

**Cloud Run:**
```bash
gcloud run deploy deskwars \
  --image gcr.io/PROJECT/deskwars \
  --add-cloudsql-instances PROJECT:REGION:INSTANCE \
  --set-env-vars DATABASE_URL="postgresql://..." \
  --min-instances 2 \
  --max-instances 10 \
  --concurrency 80
```

## Performance Optimization for 200+ Users

### 1. Connection Pooling

Prisma automatically handles connection pooling. Configure in `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  // ?connection_limit=20&pool_timeout=10
}
```

### 2. Database Indexes

Add indexes for frequently queried fields:

```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);
```

### 3. Caching Layer (Optional)

For leaderboard and frequently accessed data:

```bash
npm install ioredis
```

### 4. Load Testing

```bash
# Install Artillery
npm install -g artillery

# Test with 200 concurrent users
artillery quick --count 200 --num 1000 http://your-app-url
```

## Rollback Plan

If you need to rollback to SQLite:

1. Keep `deskwars.db` backup
2. Revert `src/db/index.ts` to use better-sqlite3
3. Revert `server.ts` changes
4. Run `npm install better-sqlite3`

## Troubleshooting

### Connection Issues
```bash
# Test PostgreSQL connection
psql "postgresql://user:password@host:5432/deskwars"
```

### Migration Errors
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Re-run migration
npx prisma migrate dev
```

### Prisma Client Not Found
```bash
# Regenerate Prisma client
npx prisma generate
```

## Next Steps

1. ✅ Complete server.ts migration to Prisma
2. ✅ Set up file storage (Google Cloud Storage/S3)
3. ✅ Add Redis caching for leaderboard
4. ✅ Configure auto-scaling
5. ✅ Set up monitoring and alerts
6. ✅ Load test with 200+ concurrent users

## Support

- Prisma Docs: https://www.prisma.io/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Cloud SQL: https://cloud.google.com/sql/docs