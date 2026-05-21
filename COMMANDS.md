# Useful Commands Cheat Sheet

## 🚀 Development Commands

### Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# View logs
tail -f logs/combined.log
tail -f logs/error.log
```

### Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart
docker-compose restart backend

# Rebuild and start
docker-compose up -d --build

# Execute command in container
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma studio

# View running containers
docker-compose ps

# Remove all containers and volumes
docker-compose down -v
```

## 💾 Database Commands

```bash
# Connect to PostgreSQL
psql -U linkedinbot -d linkedinbot

# Backup database
pg_dump -U linkedinbot linkedinbot > backup_$(date +%Y%m%d).sql

# Restore database
psql -U linkedinbot linkedinbot < backup_20260328.sql

# Docker backup
docker-compose exec postgres pg_dump -U linkedinbot linkedinbot > backup.sql

# Docker restore
docker-compose exec -T postgres psql -U linkedinbot linkedinbot < backup.sql

# Reset database (CAUTION!)
npx prisma migrate reset
```

## 🔴 Redis Commands

```bash
# Connect to Redis
redis-cli

# Check connection
redis-cli ping

# View all keys
redis-cli KEYS "*"

# Clear all data (CAUTION!)
redis-cli FLUSHALL

# Monitor commands
redis-cli MONITOR

# Get queue info
redis-cli LLEN bull:news-fetcher:wait
redis-cli LLEN bull:drafts-generator:wait
redis-cli LLEN bull:linkedin-poster:wait

# Docker Redis
docker-compose exec redis redis-cli
```

## 🔍 Debugging Commands

```bash
# Check backend health
curl http://localhost:3001/api/health

# Get all drafts
curl http://localhost:3001/api/drafts

# Get settings
curl http://localhost:3001/api/settings

# Test LinkedIn connection
curl -X POST http://localhost:3001/api/settings/test-linkedin?method=puppeteer

# Test OpenAI connection
curl -X POST http://localhost:3001/api/settings/test-openai

# Manually fetch news
curl -X POST http://localhost:3001/api/news/fetch

# Manually generate drafts
curl -X POST http://localhost:3001/api/drafts/generate

# Approve a draft
curl -X PUT http://localhost:3001/api/drafts/{draft-id}/approve

# Post immediately
curl -X POST http://localhost:3001/api/posts/{draft-id}/post-now
```

## 📊 Monitoring Commands

```bash
# Check system resources
docker stats

# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node

# Check port usage
netstat -tulpn | grep 3001
netstat -tulpn | grep 3000

# Check logs size
du -sh backend/logs/

# Monitor backend logs in real-time
tail -f backend/logs/combined.log | grep ERROR
```

## 🔧 Maintenance Commands

```bash
# Update dependencies
cd backend && npm update
cd frontend && npm update

# Check for outdated packages
npm outdated

# Clean node_modules
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf backend/dist
rm -rf frontend/.next

# Clean Docker
docker system prune -a
docker volume prune
```

## 🧪 Testing Commands

```bash
# Test news fetching
curl -X POST http://localhost:3001/api/news/fetch

# Check fetched articles
curl http://localhost:3001/api/news?limit=10

# Test draft generation
curl -X POST http://localhost:3001/api/drafts/generate

# Check pending drafts
curl http://localhost:3001/api/drafts?status=PENDING

# Check post history
curl http://localhost:3001/api/posts?limit=10
```

## 🔐 Security Commands

```bash
# Generate encryption key (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Check file permissions
ls -la backend/.env
chmod 600 backend/.env

# Scan for secrets in code (requires git-secrets)
git secrets --scan
```

## 📦 Deployment Commands

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up

# View logs
railway logs
```

### Render

```bash
# Deploy via Git push
git push origin main

# View logs via dashboard
# https://dashboard.render.com
```

### DigitalOcean

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Pull latest code
cd LinkedinBot
git pull origin main

# Restart services
docker-compose down
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## 🚨 Emergency Commands

```bash
# Stop all services immediately
docker-compose down

# Kill all Node processes
pkill -f node

# Restart PostgreSQL
docker-compose restart postgres

# Restart Redis
docker-compose restart redis

# Clear Redis queue
docker-compose exec redis redis-cli FLUSHALL

# Reset database (CAUTION!)
cd backend
npx prisma migrate reset --force

# Restore from backup
docker-compose exec -T postgres psql -U linkedinbot linkedinbot < backup.sql
```

## 📝 Git Commands

```bash
# Initialize repository
git init
git add .
git commit -m "Initial commit: LinkedIn automation bot"

# Create GitHub repository
gh repo create LinkedinBot --private

# Push to GitHub
git remote add origin https://github.com/yourusername/LinkedinBot.git
git branch -M main
git push -u origin main

# Create .gitignore
cat > .gitignore << EOF
node_modules
dist
.env
.env.local
*.log
.DS_Store
EOF

# Commit changes
git add .
git commit -m "Add feature: XYZ"
git push
```

## 🔄 Backup & Restore

```bash
# Full backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups

# Backup database
docker-compose exec postgres pg_dump -U linkedinbot linkedinbot > backups/db_$DATE.sql

# Backup .env files
cp backend/.env backups/backend_env_$DATE
cp frontend/.env.local backups/frontend_env_$DATE

# Backup logs
tar -czf backups/logs_$DATE.tar.gz backend/logs/

echo "Backup completed: $DATE"

# Full restore script
#!/bin/bash
BACKUP_DATE=$1

# Restore database
docker-compose exec -T postgres psql -U linkedinbot linkedinbot < backups/db_$BACKUP_DATE.sql

# Restore .env files
cp backups/backend_env_$BACKUP_DATE backend/.env
cp backups/frontend_env_$BACKUP_DATE frontend/.env.local

echo "Restore completed: $BACKUP_DATE"
```

## 📊 Performance Monitoring

```bash
# Check API response time
time curl http://localhost:3001/api/health

# Monitor database queries
docker-compose exec postgres psql -U linkedinbot linkedinbot -c "SELECT * FROM pg_stat_activity;"

# Check Redis memory usage
docker-compose exec redis redis-cli INFO memory

# Monitor Node.js memory
node --inspect backend/dist/server.js
```

## 🎯 Quick Troubleshooting

```bash
# Backend not starting?
cd backend
npm install
npx prisma generate
npm run dev

# Frontend not starting?
cd frontend
rm -rf .next
npm install
npm run dev

# Database connection error?
docker-compose restart postgres
npx prisma migrate deploy

# Redis connection error?
docker-compose restart redis

# Port already in use?
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

## 📚 Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# LinkedIn Bot aliases
alias lb-start='cd ~/LinkedinBot && docker-compose up -d'
alias lb-stop='cd ~/LinkedinBot && docker-compose down'
alias lb-logs='cd ~/LinkedinBot && docker-compose logs -f'
alias lb-backend='cd ~/LinkedinBot/backend && npm run dev'
alias lb-frontend='cd ~/LinkedinBot/frontend && npm run dev'
alias lb-db='cd ~/LinkedinBot/backend && npx prisma studio'
alias lb-backup='cd ~/LinkedinBot && ./backup.sh'
```

## 🎉 All Set!

Save this file for quick reference during development and maintenance.
