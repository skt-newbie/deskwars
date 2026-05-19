# PostgreSQL Local Setup Guide for Windows

Quick guide to install and configure PostgreSQL locally for DeskWars.

## Step 1: Install PostgreSQL

### Download and Install
1. Go to https://www.postgresql.org/download/windows/
2. Download the Windows installer (latest version, e.g., PostgreSQL 16)
3. Run the installer
4. During installation:
   - **Port:** Keep default `5432`
   - **Password:** Set a password for `postgres` user (remember this!)
   - **Locale:** Keep default
   - Install Stack Builder: Optional (not needed)

## Step 2: Verify Installation

```bash
# Open Command Prompt or PowerShell
# Check PostgreSQL version
psql --version

# If command not found, add to PATH:
# C:\Program Files\PostgreSQL\16\bin
```

## Step 3: Create Database

### Option A: Using pgAdmin (GUI)
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to PostgreSQL server (use your password)
3. Right-click "Databases" → Create → Database
4. Name: `deskwars`
5. Click Save

### Option B: Using Command Line
```bash
# Open SQL Shell (psql) from Start Menu
# Press Enter for defaults, then enter your password

# Create database
CREATE DATABASE deskwars;

# Verify
\l

# Exit
\q
```

## Step 4: Configure Environment

```bash
# Copy example env
cp .env.example .env

# Edit .env (use notepad or VS Code)
notepad .env
```

Update the DATABASE_URL with your password:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/deskwars"
```

Example:
```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/deskwars"
```

## Step 5: Run Migration

```bash
# 1. Export existing SQLite data
npx tsx scripts/export-sqlite-data.ts

# 2. Generate Prisma client
npx prisma generate

# 3. Create database schema
npx prisma migrate dev --name init

# 4. Import data from SQLite
npx tsx scripts/import-to-postgres.ts
```

## Step 6: Verify Migration

```bash
# Connect to database
psql -U postgres -d deskwars

# Check tables
\dt

# Check users count
SELECT COUNT(*) FROM users;

# Check submissions count
SELECT COUNT(*) FROM submissions;

# Exit
\q
```

## Step 7: Test Application

```bash
# Start development server
npm run dev

# Test in browser
# http://localhost:5000
```

## Common Issues & Solutions

### Issue: "psql: command not found"
**Solution:** Add PostgreSQL to PATH
1. Search "Environment Variables" in Windows
2. Edit "Path" variable
3. Add: `C:\Program Files\PostgreSQL\16\bin`
4. Restart terminal

### Issue: "password authentication failed"
**Solution:** 
- Double-check password in DATABASE_URL
- Ensure no spaces in connection string
- Try resetting postgres password:
  ```bash
  # In psql as postgres user
  ALTER USER postgres PASSWORD 'newpassword';
  ```

### Issue: "database does not exist"
**Solution:**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE deskwars;"
```

### Issue: Port 5432 already in use
**Solution:**
- Check if another PostgreSQL instance is running
- Stop other instance or change port in postgresql.conf

### Issue: Connection refused
**Solution:**
```bash
# Check if PostgreSQL is running
# Windows Services → PostgreSQL → Start

# Or restart service
net stop postgresql-x64-16
net start postgresql-x64-16
```

## PostgreSQL Management Tools

### pgAdmin (Included)
- GUI tool for managing PostgreSQL
- Already installed with PostgreSQL
- Access from Start Menu

### VS Code Extension
```bash
# Install PostgreSQL extension in VS Code
# Search: "PostgreSQL" by Chris Kolkman
```

### DBeaver (Alternative)
- Free universal database tool
- Download: https://dbeaver.io/

## Next Steps

After successful migration:

1. ✅ PostgreSQL installed and running
2. ✅ Database created
3. ✅ Data migrated from SQLite
4. ✅ Application connected to PostgreSQL

Now you need to:
- Update server.ts to use Prisma queries (see MIGRATION_GUIDE.md)
- Test all features
- Deploy to production

## Quick Reference

```bash
# Start PostgreSQL service
net start postgresql-x64-16

# Stop PostgreSQL service
net stop postgresql-x64-16

# Connect to database
psql -U postgres -d deskwars

# Backup database
pg_dump -U postgres deskwars > backup.sql

# Restore database
psql -U postgres deskwars < backup.sql

# List databases
psql -U postgres -l

# Drop database (careful!)
psql -U postgres -c "DROP DATABASE deskwars;"
```

## Performance Tips

### Enable connection pooling in Prisma
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/deskwars?connection_limit=20&pool_timeout=10"
```

### Monitor connections
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'deskwars';
```

## Support

- PostgreSQL Docs: https://www.postgresql.org/docs/
- Prisma Docs: https://www.prisma.io/docs/
- Stack Overflow: Tag `postgresql` + `prisma`

Your PostgreSQL setup is complete! 🎉