# MySQL Local Setup Guide

Quick guide to set up MySQL locally for DeskWars migration.

## Install MySQL

### Windows
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Run installer and select "MySQL Server"
3. Choose "Development Computer" setup
4. Set root password (remember this!)
5. Complete installation

### Mac
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

## Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE deskwars;

# Create user (optional, for better security)
CREATE USER 'deskwars_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON deskwars.* TO 'deskwars_user'@'localhost';
FLUSH PRIVILEGES;

# Exit
EXIT;
```

## Configure Environment

```bash
# Copy example env
cp .env.example .env

# Edit .env
nano .env
```

Update DATABASE_URL:
```env
# Using root user
DATABASE_URL="mysql://root:your_root_password@localhost:3306/deskwars"

# Or using dedicated user
DATABASE_URL="mysql://deskwars_user:your_password@localhost:3306/deskwars"
```

## Run Migration

```bash
# 1. Export SQLite data
npx tsx scripts/export-sqlite-data.ts

# 2. Generate Prisma client
npx prisma generate

# 3. Create database schema
npx prisma migrate dev --name init

# 4. Import data
npx tsx scripts/import-to-postgres.ts

# 5. Verify
mysql -u root -p deskwars -e "SELECT COUNT(*) FROM users;"
```

## Test Connection

```bash
# Test MySQL connection
mysql -u root -p -e "SHOW DATABASES;"

# Check if deskwars database exists
mysql -u root -p -e "USE deskwars; SHOW TABLES;"
```

## Common Issues

### Can't connect to MySQL
```bash
# Check if MySQL is running
# Windows: Services > MySQL
# Mac: brew services list
# Linux: sudo systemctl status mysql

# Start MySQL if not running
# Mac: brew services start mysql
# Linux: sudo systemctl start mysql
```

### Access denied error
- Double-check password in DATABASE_URL
- Ensure user has proper privileges
- Try using root user first

### Port already in use
- Default MySQL port is 3306
- Check if another service is using it
- Change port in my.cnf if needed

## Next Steps

After MySQL is set up and migration is complete:
1. Update server.ts to use Prisma (see MIGRATION_GUIDE.md)
2. Test the application: `npm run dev`
3. Verify all features work with MySQL
4. Deploy to production

## MySQL vs PostgreSQL

**Why MySQL is also good:**
- ✅ Widely supported
- ✅ Easy to set up locally
- ✅ Good performance for 200+ users
- ✅ Available on all major cloud providers
- ✅ Familiar to most developers

**Both work great for your use case!**