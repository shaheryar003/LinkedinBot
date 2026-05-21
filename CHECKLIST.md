# ✅ Quick Start Checklist

Use this checklist to get your LinkedIn bot up and running in 30 minutes.

## Prerequisites ✓

- [ ] Node.js 18+ installed (`node -v`)
- [ ] PostgreSQL installed and running
- [ ] Redis installed and running
- [ ] OpenAI API key ready
- [ ] LinkedIn account credentials ready

## Setup Steps

### 1. Installation (5 minutes)

- [ ] Navigate to project directory
- [ ] Run setup script:
  ```bash
  # Windows
  setup.bat

  # Mac/Linux
  chmod +x setup.sh
  ./setup.sh
  ```
- [ ] Or install manually:
  ```bash
  cd backend && npm install
  cd ../frontend && npm install
  ```

### 2. Configuration (5 minutes)

- [ ] Edit `backend/.env`:
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/linkedinbot
  REDIS_URL=redis://localhost:6379
  OPENAI_API_KEY=sk-your-key-here
  LINKEDIN_EMAIL=your-email@example.com
  LINKEDIN_PASSWORD=your-password
  PAGE_URL=DigitalKarvan
  ```

- [ ] Verify `frontend/.env.local`:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

### 3. Database Setup (2 minutes)

- [ ] Generate Prisma client:
  ```bash
  cd backend
  npx prisma generate
  ```

- [ ] Run migrations:
  ```bash
  npx prisma migrate dev
  ```

- [ ] Verify database:
  ```bash
  npx prisma studio
  # Opens at http://localhost:5555
  ```

### 4. Start Services (2 minutes)

- [ ] Start backend (Terminal 1):
  ```bash
  cd backend
  npm run dev
  # Should show: Server running on port 3001
  ```

- [ ] Start frontend (Terminal 2):
  ```bash
  cd frontend
  npm run dev
  # Should show: Ready on http://localhost:3000
  ```

### 5. Verify Installation (5 minutes)

- [ ] Open http://localhost:3000
- [ ] Dashboard loads without errors
- [ ] Navigation works (Dashboard, Drafts, History, Settings)
- [ ] No console errors (F12 → Console)

### 6. Configure Settings (5 minutes)

- [ ] Go to Settings page
- [ ] Enter LinkedIn credentials
- [ ] Select posting method (Puppeteer recommended)
- [ ] Click "Test LinkedIn Connection"
  - [ ] Should show "LinkedIn connection successful"
- [ ] Enter OpenAI API key
- [ ] Click "Test OpenAI Connection"
  - [ ] Should show "OpenAI connection successful"
- [ ] Set posting times (default: 9:00 AM, 3:00 PM)
- [ ] Enable "System Active"
- [ ] Click "Save Settings"

### 7. Test the System (10 minutes)

- [ ] Go to Dashboard
- [ ] Click "Fetch News"
  - [ ] Should fetch articles from TechCrunch, Hacker News, Dev.to
  - [ ] Check "Unused Articles" count increases
- [ ] Click "Generate Drafts"
  - [ ] Should generate 5-6 post variations
  - [ ] Check "Pending Drafts" count increases
- [ ] Go to Drafts page
  - [ ] Should see generated drafts
  - [ ] Review content
  - [ ] Click "Approve" on 2 best drafts
- [ ] (Optional) Test immediate posting:
  - [ ] Go to Posts → Post Now
  - [ ] Verify post appears on LinkedIn

## Troubleshooting

### Backend won't start?
```bash
# Check logs
tail -f backend/logs/combined.log

# Verify PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify Redis is running
redis-cli ping
```

### Frontend looks broken?
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Database errors?
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

### Can't connect to backend?
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check firewall/antivirus isn't blocking ports 3000, 3001
```

## Production Deployment Checklist

When ready to deploy:

- [ ] Update environment variables for production
- [ ] Set NODE_ENV=production
- [ ] Use production database (not localhost)
- [ ] Enable HTTPS
- [ ] Set up monitoring (UptimeRobot, Sentry)
- [ ] Configure automated backups
- [ ] Test all features in production
- [ ] Set up error alerts
- [ ] Document deployment process

## Daily Operations Checklist

Once running:

- [ ] Check Dashboard for system status
- [ ] Review pending drafts (if any)
- [ ] Approve 2 drafts for posting
- [ ] Check History for posted content
- [ ] Verify posts appear on LinkedIn
- [ ] Monitor for errors in logs

## Weekly Maintenance Checklist

- [ ] Review posting success rate
- [ ] Check job logs for errors
- [ ] Backup database
- [ ] Review and optimize AI prompts
- [ ] Check disk space
- [ ] Update dependencies (if needed)

## Monthly Checklist

- [ ] Analyze engagement metrics
- [ ] Rotate API keys
- [ ] Review and update news sources
- [ ] Optimize posting times based on engagement
- [ ] Update documentation
- [ ] Review costs

## Success Criteria ✓

Your bot is working correctly when:

- ✅ News fetches automatically at 6:00 AM
- ✅ Drafts generate automatically at 6:30 AM
- ✅ You can approve drafts via UI
- ✅ Posts publish automatically at 9:00 AM and 3:00 PM
- ✅ All posts appear on LinkedIn
- ✅ No errors in logs
- ✅ System runs 24/7 without intervention

## 🎉 You're Done!

If all checkboxes are checked, your LinkedIn automation bot is fully operational!

**Next Steps:**
1. Let it run for 24 hours to verify automation
2. Monitor the first few posts
3. Adjust settings as needed
4. Deploy to production when ready

**Need Help?**
- See TROUBLESHOOTING.md for common issues
- See QUICKSTART.md for detailed instructions
- See DEPLOYMENT.md for production deployment

---

**Estimated Setup Time:** 30 minutes
**Difficulty:** Beginner-friendly
**Status:** Production-ready

Happy automating! 🚀
