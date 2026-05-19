# 🚀 Deskwars Platform Startup Guide

This guide will help you initialize and start the Deskwars carnival platform from scratch.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database running (via Docker or local installation)
- npm or yarn package manager

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure your database:

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://deskwars:deskwars123@localhost:5432/deskwars"
```

### 3. Database Setup (Complete Setup)

Run the complete database setup command:

```bash
npm run db:setup
```

This single command will:
- Run Prisma migrations to create all tables
- Generate Prisma Client
- Initialize the database with:
  - Game configurations (Desk Wars, Hidden Chaos, Tick Tick Boom)
  - 24 inventory items with quantities
  - 31 game allocations (prizes for different games)

**OR** Run steps individually:

```bash
# Step 1: Run migrations
npm run db:migrate

# Step 2: Generate Prisma Client
npm run db:generate

# Step 3: Initialize data
npm run db:init
```

### 4. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Database Initialization Details

The `npm run db:init` script populates your database with:

### Game Configurations (3 items)
- Desk Wars (enabled)
- Hidden Chaos (enabled)
- Tick Tick Boom (enabled)

### Inventory Items (24 items)
Including:
- Premium tech items (gaming mouse, keyboard, controller)
- Useful items (cables, cleaning kits, neck pillows)
- Fun items (LED lights, diffusers, toys)
- Snacks (chips, popcorn)

### Game Allocations (31 prizes)

**Complete the Madness (FP)** - 3 prizes
- Gaming controller, wireless mouse, keyboard

**Desk Wars (CD)** - 3 prizes
- Premium wireless mice

**QR Hunt (QR)** - 15 prizes
- Various tech items, LED lights, diffusers, neck pillows

**Mystery Gifts (MG)** - 10 prizes
- Mix of premium, useful, and dummy prizes

## Available NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:init` | Initialize database with game data |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:setup` | Complete database setup (migrate + generate + init) |
| `npm run lint` | Run TypeScript type checking |

## Resetting the Platform

To reset all game data and restore inventory:

1. Access the Admin Panel at `http://localhost:5000/admin`
2. Click the "Reset Platform" button
3. Confirm the action

This will:
- Delete all user submissions
- Delete all QR scans and riddle attempts
- Delete all prize claims
- Delete all mystery node claims
- Delete all Tick Tick Boom sessions
- Restore all inventory quantities to initial values

## Troubleshooting

### Database Connection Issues

If you see connection errors:

1. Ensure PostgreSQL is running:
   ```bash
   docker ps  # Check if container is running
   ```

2. Verify connection string in `.env`

3. Test connection:
   ```bash
   psql -h localhost -U deskwars -d deskwars
   ```

### Prisma Client Errors

If you see "Property does not exist" errors:

```bash
npm run db:generate
```

This regenerates the Prisma Client with updated schema.

### Port Already in Use

If port 5000 is busy:

1. Change port in `server.ts`:
   ```typescript
   const PORT = process.env.PORT || 5001;
   ```

2. Or kill the process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -ti:5000 | xargs kill -9
   ```

## Next Steps

After startup:

1. **Test the platform**: Visit `http://localhost:5000`
2. **Create admin account**: Register and verify as admin
3. **Configure games**: Use Admin Panel to enable/disable games
4. **Generate QR codes**: Create physical QR codes for:
   - QRP_01 through QRP_15 (QR Hunt riddles)
   - MG_01 through MG_10 (Mystery Gifts)
5. **Place QR codes**: Position them at designated office locations
6. **Monitor activity**: Use Admin Panel to track prize claims

## Production Deployment

For production deployment:

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Run migrations on production database:
   ```bash
   npm run db:migrate
   ```

4. Initialize production data:
   ```bash
   npm run db:init
   ```

5. Start production server:
   ```bash
   npm start
   ```

## Support

For issues or questions:
- Check the API documentation: `QR_HUNT_API_DOCUMENTATION.md`
- Review migration guides: `MIGRATION_GUIDE.md`, `PRISMA_CONVERSION_GUIDE.md`
- Check deployment guide: `DEPLOYMENT_GUIDE.md`

---

**Happy Gaming! 🎮🎉**