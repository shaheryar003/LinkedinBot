# UI Troubleshooting Guide

## 🎨 Frontend UI Issues - FIXED

The frontend UI has been completely fixed with the following updates:

### What Was Fixed:
1. ✅ Removed `react-hot-toast` dependency (was causing issues)
2. ✅ Added proper PostCSS configuration
3. ✅ Fixed Tailwind CSS setup
4. ✅ Updated all pages to use native alerts instead of toast
5. ✅ Fixed navigation links to use Next.js Link component
6. ✅ Added proper error handling and loading states
7. ✅ Added transition animations for better UX
8. ✅ Fixed all TypeScript types

### How to Apply the Fixes:

1. **Reinstall Frontend Dependencies:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clear Next.js Cache:**
   ```bash
   rm -rf .next
   ```

3. **Restart the Frontend:**
   ```bash
   npm run dev
   ```

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to load dashboard stats"

**Cause:** Backend is not running or not accessible

**Solution:**
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# If not running, start it:
cd backend
npm run dev

# Check backend logs for errors
tail -f logs/combined.log
```

### Issue 2: Styles Not Loading / UI Looks Broken

**Cause:** Tailwind CSS not properly configured

**Solution:**
```bash
cd frontend

# Make sure postcss.config.js exists
# Make sure tailwind.config.ts exists
# Make sure globals.css is imported in layout.tsx

# Clear cache and rebuild
rm -rf .next
npm run dev
```

### Issue 3: "Cannot connect to database"

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Start PostgreSQL (Windows)
net start postgresql-x64-15

# Start PostgreSQL (Mac)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Verify DATABASE_URL in backend/.env
# Format: postgresql://user:password@localhost:5432/linkedinbot
```

### Issue 4: "Redis connection failed"

**Cause:** Redis not running

**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis (Windows - requires WSL or Redis for Windows)
redis-server

# Start Redis (Mac)
brew services start redis

# Start Redis (Linux)
sudo systemctl start redis

# Or use Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

### Issue 5: Navigation Links Not Working

**Cause:** Using <a> tags instead of Next.js Link

**Solution:** Already fixed in the updated layout.tsx. If still having issues:
```bash
cd frontend
rm -rf .next
npm run dev
```

### Issue 6: "Module not found" Errors

**Cause:** Missing dependencies or incorrect imports

**Solution:**
```bash
cd frontend
npm install
cd ../backend
npm install

# If still having issues, clear everything:
rm -rf node_modules package-lock.json
npm install
```

### Issue 7: Port Already in Use

**Cause:** Previous instance still running

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Issue 8: Prisma Client Not Generated

**Cause:** Prisma client needs to be regenerated

**Solution:**
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### Issue 9: Environment Variables Not Loading

**Cause:** .env files not in correct location or format

**Solution:**
```bash
# Backend .env should be at: backend/.env
# Frontend .env.local should be at: frontend/.env.local

# Check format (no spaces around =):
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...

# Restart servers after changing .env files
```

### Issue 10: TypeScript Errors

**Cause:** Type mismatches or missing types

**Solution:**
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build

# If errors persist, check tsconfig.json is correct
```

## 🔍 Debugging Steps

### Step 1: Check Backend Health
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Step 2: Check Database Connection
```bash
cd backend
npx prisma studio
# Should open database GUI at http://localhost:5555
```

### Step 3: Check Frontend Build
```bash
cd frontend
npm run build
# Should complete without errors
```

### Step 4: Check Browser Console
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

### Step 5: Check Logs
```bash
# Backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Frontend logs (in terminal where npm run dev is running)
```

## 🚀 Quick Reset (Nuclear Option)

If nothing works, try this complete reset:

```bash
# Stop all services
# Kill all Node processes

# Backend reset
cd backend
rm -rf node_modules package-lock.json dist logs
npm install
npx prisma generate
npx prisma migrate reset --force

# Frontend reset
cd ../frontend
rm -rf node_modules package-lock.json .next
npm install

# Start fresh
cd ../backend
npm run dev

# In new terminal
cd frontend
npm run dev
```

## 📱 Browser Compatibility

Tested and working on:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

## 🎯 Performance Tips

1. **Use Production Build:**
   ```bash
   cd frontend
   npm run build
   npm start
   ```

2. **Enable Caching:**
   - Browser caching is automatic
   - API responses are cached where appropriate

3. **Optimize Images:**
   - Use Next.js Image component for any images
   - Already configured in next.config.js

## ✅ Verification Checklist

After fixing UI issues, verify:

- [ ] Dashboard loads and shows stats
- [ ] Navigation links work (Dashboard, Drafts, History, Settings)
- [ ] Buttons have hover effects
- [ ] Forms are styled correctly
- [ ] Tables display properly
- [ ] Colors match design (blue primary, green success, red error)
- [ ] Mobile responsive (test on small screen)
- [ ] No console errors in browser
- [ ] API calls work (check Network tab)
- [ ] Loading states show correctly

## 🆘 Still Having Issues?

1. **Check this file first:** TROUBLESHOOTING.md
2. **Review logs:** backend/logs/combined.log
3. **Check GitHub issues:** (if repository is public)
4. **Verify all dependencies are installed:**
   ```bash
   cd backend && npm list
   cd ../frontend && npm list
   ```

## 📞 Getting Help

When asking for help, provide:
1. Error message (full text)
2. Browser console output
3. Backend logs
4. Node.js version: `node -v`
5. Operating system
6. Steps to reproduce

---

**Last Updated:** 2026-03-28

All UI issues have been resolved. The frontend should now work perfectly with proper styling, navigation, and functionality.
