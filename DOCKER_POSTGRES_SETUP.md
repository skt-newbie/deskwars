# Docker PostgreSQL Setup Guide

Easiest way to run PostgreSQL locally using Docker - no heavy installation needed!

## Prerequisites

**Install Docker Desktop:**
- Windows: https://www.docker.com/products/docker-desktop/
- Download and install (~500MB, but includes everything)
- Restart computer after installation

## Quick Start (3 Steps)

### Step 1: Start PostgreSQL Container

```bash
# Using docker-compose (recommended)
docker-compose up -d

# Or using docker run directly
docker run --name deskwars-postgres \
  -e POSTGRES_PASSWORD=deskwars123 \
  -e POSTGRES_DB=deskwars \
  -p 5432:5432 \
  -d postgres:16-alpine
```

**What this does:**
- Downloads PostgreSQL Alpine image (~50MB)
- Creates database named `deskwars`
- Sets password to `deskwars123`
- Exposes port 5432 to your machine
- Runs in background (`-d` flag)

### Step 2: Update .env File

```bash
# Copy example
cp .env.example .env

# Edit .env
notepad .env
```

Add this line:
```env
DATABASE_URL="postgresql://postgres:deskwars123@localhost:5432/deskwars"
```

### Step 3: Run Migration

```bash
# Generate Prisma client (already done)
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Start your app
npm run dev
```

**Done!** Your app is now connected to PostgreSQL running in Docker.

## Docker Commands Reference

### Container Management

```bash
# Start PostgreSQL
docker-compose up -d
# or
docker start deskwars-postgres

# Stop PostgreSQL
docker-compose down
# or
docker stop deskwars-postgres

# View logs
docker logs deskwars-postgres

# Check if running
docker ps

# View all containers (including stopped)
docker ps -a

# Remove container (data will be lost unless using volumes)
docker rm deskwars-postgres

# Remove container and volume (complete cleanup)
docker-compose down -v
```

### Database Access

```bash
# Connect to PostgreSQL inside container
docker exec -it deskwars-postgres psql -U postgres -d deskwars

# Once inside psql:
\dt              # List tables
\d users         # Describe users table
SELECT * FROM users;
\q               # Quit
```

### Backup & Restore

```bash
# Backup database
docker exec deskwars-postgres pg_dump -U postgres deskwars > backup.sql

# Restore database
docker exec -i deskwars-postgres psql -U postgres deskwars < backup.sql
```

## Using docker-compose.yml

Your project now has a `docker-compose.yml` file with PostgreSQL configured.

**Advantages:**
- ✅ One command to start/stop
- ✅ Configuration in file (no long commands)
- ✅ Persistent data with volumes
- ✅ Easy to share with team

**Commands:**
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f postgres

# Restart
docker-compose restart

# Remove everything (including data)
docker-compose down -v
```

## Configuration Details

**From docker-compose.yml:**
```yaml
POSTGRES_USER: postgres          # Username
POSTGRES_PASSWORD: deskwars123   # Password (change in production!)
POSTGRES_DB: deskwars           # Database name
Port: 5432                       # PostgreSQL port
```

**Connection String:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
postgresql://postgres:deskwars123@localhost:5432/deskwars
```

## Troubleshooting

### Port 5432 already in use
```bash
# Check what's using port 5432
netstat -ano | findstr :5432

# Stop other PostgreSQL service
# Or change port in docker-compose.yml:
ports:
  - "5433:5432"  # Use 5433 on host

# Update DATABASE_URL:
DATABASE_URL="postgresql://postgres:deskwars123@localhost:5433/deskwars"
```

### Container won't start
```bash
# Check logs
docker logs deskwars-postgres

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Can't connect from app
```bash
# Verify container is running
docker ps

# Test connection
docker exec deskwars-postgres pg_isready -U postgres

# Check if port is accessible
telnet localhost 5432
```

### Docker Desktop not running
- Start Docker Desktop from Start Menu
- Wait for "Docker Desktop is running" notification
- Try command again

## Data Persistence

**With docker-compose (recommended):**
- Data stored in Docker volume `postgres_data`
- Survives container restarts
- Only deleted with `docker-compose down -v`

**Without volumes:**
- Data lost when container is removed
- Use volumes for persistent data

## Advantages of Docker PostgreSQL

✅ **Lightweight** - Only ~50MB Alpine image
✅ **Isolated** - Doesn't affect your system
✅ **Easy cleanup** - Remove container, done
✅ **Consistent** - Same environment everywhere
✅ **Fast** - Start/stop in seconds
✅ **No conflicts** - Runs in its own container

## Production Note

**For production deployment:**
- Don't use Docker PostgreSQL
- Use managed PostgreSQL:
  - Google Cloud SQL
  - AWS RDS
  - Supabase
  - Neon

Docker is perfect for local development!

## Complete Workflow

```bash
# 1. Start PostgreSQL
docker-compose up -d

# 2. Update .env
DATABASE_URL="postgresql://postgres:deskwars123@localhost:5432/deskwars"

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Start app
npm run dev

# 5. When done, stop PostgreSQL
docker-compose down
```

## Next Steps

After PostgreSQL is running:
1. ✅ Migrate data from SQLite (optional)
2. ✅ Update server.ts to use Prisma
3. ✅ Test all features
4. ✅ Deploy to production

Your Docker PostgreSQL setup is complete! 🐳