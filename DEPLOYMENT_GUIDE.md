# DeskWars Deployment Guide for 200+ Concurrent Users

Complete guide for deploying and testing DeskWars with PostgreSQL for production scale.

## Quick Start

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEYS and DATABASE_URL

# 3. Run development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Test production build locally
npm start
```

## Database Setup

### Current State: SQLite (Development Only)
- ✅ Good for: Single server, <50 concurrent users
- ❌ Not suitable for: 200+ concurrent users, multiple instances

### Migration to PostgreSQL (Required for Production)

Follow the complete migration guide in [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

**Quick Migration Steps:**
```bash
# 1. Export SQLite data
npx tsx scripts/export-sqlite-data.ts

# 2. Set DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@host:5432/deskwars"

# 3. Generate Prisma client
npx prisma generate

# 4. Create database schema
npx prisma migrate dev --name init

# 5. Import data
npx tsx scripts/import-to-postgres.ts
```

## Production Deployment Options

### Option 1: Google Cloud Run (Recommended)

**Why Cloud Run?**
- Auto-scaling (2-10 instances)
- Pay per use
- Integrated with Cloud SQL
- Built-in load balancing
- Your app is already linked to AI Studio

**Setup:**

1. **Create Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
```

2. **Create .dockerignore:**
```
node_modules
.env
.env.local
deskwars.db*
sqlite-export.json
uploads
.git
```

3. **Set up Cloud SQL:**
```bash
# Create PostgreSQL instance
gcloud sql instances create deskwars-db \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-auto-increase

# Create database
gcloud sql databases create deskwars --instance=deskwars-db

# Create user
gcloud sql users create deskwars-user \
  --instance=deskwars-db \
  --password=YOUR_SECURE_PASSWORD
```

4. **Set up Cloud Storage for uploads:**
```bash
# Create bucket
gsutil mb gs://deskwars-uploads

# Set public read access (if needed)
gsutil iam ch allUsers:objectViewer gs://deskwars-uploads
```

5. **Deploy to Cloud Run:**
```bash
# Build and push container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/deskwars

# Deploy with auto-scaling
gcloud run deploy deskwars \
  --image gcr.io/YOUR_PROJECT_ID/deskwars \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 2 \
  --max-instances 10 \
  --concurrency 80 \
  --cpu 2 \
  --memory 2Gi \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:deskwars-db \
  --set-env-vars GEMINI_API_KEYS="your-keys" \
  --set-env-vars DATABASE_URL="postgresql://deskwars-user:password@/deskwars?host=/cloudsql/YOUR_PROJECT_ID:us-central1:deskwars-db" \
  --set-env-vars APP_URL="https://deskwars-xxx.run.app" \
  --set-env-vars STORAGE_BUCKET="deskwars-uploads"
```

**Cost Estimate:** $30-60/month for 200 concurrent users

### Option 2: Traditional VPS (DigitalOcean, AWS EC2)

**Setup:**

1. **Provision server:**
   - 2 vCPUs, 4GB RAM minimum
   - Ubuntu 22.04 LTS

2. **Install dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2
```

3. **Set up PostgreSQL:**
```bash
sudo -u postgres psql
CREATE DATABASE deskwars;
CREATE USER deskwars_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE deskwars TO deskwars_user;
\q
```

4. **Deploy application:**
```bash
# Clone repository
git clone your-repo-url
cd deskwars

# Install dependencies
npm install

# Set up environment
cp .env.example .env
nano .env  # Edit with your values

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Start with PM2
pm2 start dist/server.cjs --name deskwars -i 2
pm2 save
pm2 startup
```

5. **Set up Nginx reverse proxy:**
```bash
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/deskwars
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/deskwars /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Cost Estimate:** $20-40/month

### Option 3: Managed Platforms (Render, Railway, Fly.io)

**Render.com:**
1. Connect GitHub repository
2. Select "Web Service"
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add PostgreSQL database (managed)
6. Set environment variables

**Cost Estimate:** $25-50/month

## File Storage Migration

### Current: Local uploads/ folder
❌ Won't work with multiple instances

### Solution: Cloud Storage

**Google Cloud Storage:**
```bash
npm install @google-cloud/storage
```

**Update multer configuration in server.ts:**
```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucket = storage.bucket(process.env.STORAGE_BUCKET!);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Upload handler
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const blob = bucket.file(`${Date.now()}-${req.file.originalname}`);
  const blobStream = blob.createWriteStream();
  
  blobStream.on('finish', () => {
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    // Save publicUrl to database
  });
  
  blobStream.end(req.file.buffer);
});
```

## Testing Strategy

### 1. Local Testing
```bash
# Run development server
npm run dev

# Test all endpoints
curl http://localhost:5000/api/health
```

### 2. Load Testing

**Install Artillery:**
```bash
npm install -g artillery
```

**Create load-test.yml:**
```yaml
config:
  target: "http://your-app-url"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load - 200 users"
    - duration: 60
      arrivalRate: 100
      name: "Spike test"
  
scenarios:
  - name: "User flow"
    flow:
      - get:
          url: "/"
      - get:
          url: "/api/leaderboard"
      - post:
          url: "/api/verify"
          json:
            username: "test{{ $randomNumber() }}"
```

**Run load test:**
```bash
artillery run load-test.yml
```

### 3. Database Performance Testing
```bash
# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
psql $DATABASE_URL -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

## Performance Optimization

### 1. Add Redis Caching
```bash
npm install ioredis
```

```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache leaderboard
app.get('/api/leaderboard', async (req, res) => {
  const cached = await redis.get('leaderboard');
  if (cached) return res.json(JSON.parse(cached));
  
  const leaderboard = await prisma.user.findMany({
    orderBy: { totalPoints: 'desc' },
    take: 100,
  });
  
  await redis.setex('leaderboard', 60, JSON.stringify(leaderboard));
  res.json(leaderboard);
});
```

### 2. Database Indexes
```sql
CREATE INDEX idx_users_total_points ON users(total_points DESC);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
```

### 3. Enable Compression
```typescript
import compression from 'compression';
app.use(compression());
```

### 4. Rate Limiting
```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

app.use('/api/', limiter);
```

## Monitoring & Alerts

### 1. Health Check Endpoint
```typescript
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

### 2. Logging
```bash
npm install winston
```

### 3. Error Tracking
```bash
npm install @sentry/node
```

### 4. Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- Cloud Monitoring (GCP)

## Security Checklist

- [ ] Environment variables secured (never commit .env)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Rate limiting configured
- [ ] File upload validation (size, type)
- [ ] SQL injection prevention (Prisma handles this)
- [ ] CORS properly configured
- [ ] Database credentials rotated regularly
- [ ] Backup strategy in place

## Backup Strategy

### Database Backups
```bash
# Automated daily backups (Cloud SQL)
gcloud sql backups create --instance=deskwars-db

# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### File Storage Backups
```bash
# Sync to backup bucket
gsutil -m rsync -r gs://deskwars-uploads gs://deskwars-uploads-backup
```

## Rollback Plan

1. Keep previous container image
2. Database migration rollback: `npx prisma migrate resolve --rolled-back`
3. Redeploy previous version
4. Restore database from backup if needed

## Cost Breakdown (200 Concurrent Users)

**Google Cloud Run + Cloud SQL:**
- Cloud Run: $15-30/month
- Cloud SQL (db-g1-small): $25-35/month
- Cloud Storage: $5-10/month
- **Total: $45-75/month**

**VPS (DigitalOcean):**
- Droplet (4GB RAM): $24/month
- Managed PostgreSQL: $15/month
- **Total: $39/month**

## Next Steps

1. ✅ Complete PostgreSQL migration
2. ✅ Migrate file uploads to Cloud Storage
3. ✅ Deploy to Cloud Run with auto-scaling
4. ✅ Run load tests with 200+ concurrent users
5. ✅ Set up monitoring and alerts
6. ✅ Configure automated backups
7. ✅ Add Redis caching for performance
8. ✅ Document API endpoints

## Support Resources

- [Migration Guide](MIGRATION_GUIDE.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)