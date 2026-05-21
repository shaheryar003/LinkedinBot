# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- PostgreSQL running locally or accessible
- Redis running locally or accessible
- OpenAI API key (get from https://platform.openai.com)
- LinkedIn account with company page access

### Step 1: Clone & Install

```bash
# Navigate to the project
cd LinkedinBot

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

**Backend Configuration:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/linkedinbot
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-key-here
LINKEDIN_EMAIL=your-linkedin-email@example.com
LINKEDIN_PASSWORD=your-linkedin-password
PAGE_URL=DigitalKarvan
POSTING_TIMES=09:00,15:00
```

**Frontend Configuration:**
```bash
cd ../frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Setup Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# (Optional) Seed with test data
npx prisma db seed
```

### Step 4: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### Step 5: Access the Application

Open your browser and go to: **http://localhost:3000**

## 📝 First Time Setup

1. **Go to Settings** (http://localhost:3000/settings)
2. **Configure LinkedIn:**
   - Choose posting method (Puppeteer recommended for first time)
   - Enter your LinkedIn email and password
   - Click "Test LinkedIn Connection"
3. **Configure OpenAI:**
   - Paste your OpenAI API key
   - Click "Test OpenAI Connection"
4. **Set Posting Times:**
   - Default is 9:00 AM and 3:00 PM
   - Adjust as needed
5. **Save Settings**

## 🔄 Workflow

### Automatic (Runs Daily)
- **6:00 AM**: Fetches trending tech news
- **6:30 AM**: Generates 5-6 AI post variations
- **9:00 AM & 3:00 PM**: Posts approved drafts

### Manual Actions
1. **Dashboard** - View system status and quick stats
2. **Drafts** - Review AI-generated posts
   - Approve the best 2 posts
   - Edit if needed
   - Reject unwanted posts
3. **History** - See all posted content
4. **Settings** - Manage credentials and schedule

## 🧪 Testing

### Manual News Fetch
```bash
# In Dashboard, click "Fetch News" button
# Or via API:
curl -X POST http://localhost:3001/api/news/fetch
```

### Manual Draft Generation
```bash
# In Dashboard, click "Generate Drafts" button
# Or via API:
curl -X POST http://localhost:3001/api/drafts/generate
```

### Test LinkedIn Connection
```bash
# In Settings, click "Test LinkedIn Connection"
# Or via API:
curl http://localhost:3001/api/settings/test-linkedin?method=puppeteer
```

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

## 📊 Monitoring

### View Job Logs
```bash
# In backend, check database:
npx prisma studio

# Navigate to JobLog table to see all job executions
```

### Check System Status
- Dashboard shows real-time stats
- Settings page shows system active/inactive status
- Logs available in `backend/logs/` directory

## 🔐 Security Tips

1. **Never commit .env files** - They're in .gitignore
2. **Rotate API keys regularly** - Update in Settings
3. **Use strong passwords** - For LinkedIn and database
4. **Enable HTTPS in production** - Use reverse proxy
5. **Backup database regularly** - PostgreSQL backups

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql -U linkedinbot -d linkedinbot

# Verify DATABASE_URL in .env
```

### "Redis connection failed"
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```

### "LinkedIn login fails"
- Verify email/password are correct
- Check for CAPTCHA or 2FA
- Try switching to LinkedIn API method
- Check `backend/screenshots/` for login page screenshots

### "OpenAI API errors"
- Verify API key is correct
- Check API key has sufficient credits
- Ensure model name is correct (gpt-4 or gpt-4-turbo)

### "Posts not generating"
- Check news articles were fetched
- Verify OpenAI connection works
- Check job logs in database
- Review `backend/logs/combined.log`

## 📚 API Documentation

### Get All Drafts
```bash
curl http://localhost:3001/api/drafts?status=PENDING&limit=20
```

### Approve a Draft
```bash
curl -X PUT http://localhost:3001/api/drafts/{id}/approve
```

### Get Settings
```bash
curl http://localhost:3001/api/settings
```

### Update Settings
```bash
curl -X PUT http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "linkedinEmail": "new-email@example.com",
    "postingTimes": ["08:00", "16:00"],
    "isActive": true
  }'
```

## 🚀 Production Deployment

### Option 1: Railway (Recommended)
1. Push code to GitHub
2. Connect Railway to GitHub repo
3. Add PostgreSQL and Redis plugins
4. Set environment variables
5. Deploy

### Option 2: Render
1. Create Render account
2. Connect GitHub repo
3. Create Web Service for backend
4. Create Web Service for frontend
5. Add PostgreSQL and Redis
6. Deploy

### Option 3: DigitalOcean
1. Create Droplet (Ubuntu 22.04)
2. Install Docker and Docker Compose
3. Clone repository
4. Configure .env files
5. Run `docker-compose up -d`

## 📞 Support

For issues:
1. Check logs: `backend/logs/combined.log`
2. Review database: `npx prisma studio`
3. Test connections in Settings page
4. Check GitHub issues

## 🎉 You're All Set!

Your LinkedIn bot is ready to automate posting for DigitalKarvan. The system will:
- Fetch trending tech news daily
- Generate engaging AI posts
- Wait for your approval
- Post automatically at scheduled times

Happy automating! 🚀
