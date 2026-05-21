# Deployment Guide

## 🌐 Production Deployment Options

### Option 1: Railway (Easiest - Recommended)

**Pros:** One-click deployment, automatic HTTPS, easy scaling
**Cost:** $5-20/month

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select LinkedinBot repository

3. **Add Services**
   - Add PostgreSQL plugin
   - Add Redis plugin
   - Backend service (from Dockerfile)
   - Frontend service (from Dockerfile)

4. **Configure Environment**
   - Set all variables from `.env.example`
   - Railway provides DATABASE_URL and REDIS_URL automatically

5. **Deploy**
   - Push to main branch
   - Railway auto-deploys

**Railway Dashboard:**
```
Backend: https://linkedinbot-backend.railway.app
Frontend: https://linkedinbot-frontend.railway.app
```

### Option 2: Render

**Pros:** Free tier available, good performance
**Cost:** Free-$25/month

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Services**
   - New Web Service → Connect GitHub repo
   - Backend: Select backend directory, Node environment
   - Frontend: Select frontend directory, Node environment

3. **Add Databases**
   - PostgreSQL: Create managed database
   - Redis: Create managed Redis

4. **Environment Variables**
   - Add all from `.env.example`
   - Use Render's database URLs

5. **Deploy**
   - Render auto-deploys on push

### Option 3: DigitalOcean App Platform

**Pros:** Full control, good documentation
**Cost:** $12-30/month

1. **Create DigitalOcean Account**
   - Go to https://digitalocean.com
   - Create account

2. **Create App**
   - Apps → Create App
   - Connect GitHub repo
   - Select LinkedinBot

3. **Configure Services**
   - Backend service (Dockerfile)
   - Frontend service (Dockerfile)
   - PostgreSQL database
   - Redis database

4. **Set Environment Variables**
   - Add all from `.env.example`

5. **Deploy**
   - Click Deploy

### Option 4: Self-Hosted (VPS)

**Pros:** Full control, potentially cheaper long-term
**Cost:** $5-15/month for VPS

1. **Get a VPS**
   - DigitalOcean, Linode, Vultr, etc.
   - Ubuntu 22.04 recommended
   - 2GB RAM minimum

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Install Git
   sudo apt install git -y
   ```

3. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd LinkedinBot
   ```

4. **Configure Environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your credentials
   ```

5. **Start Services**
   ```bash
   docker-compose up -d
   docker-compose exec backend npx prisma migrate deploy
   ```

6. **Setup Reverse Proxy (Nginx)**
   ```bash
   sudo apt install nginx -y
   ```

   Create `/etc/nginx/sites-available/linkedinbot`:
   ```nginx
   upstream backend {
     server localhost:3001;
   }

   upstream frontend {
     server localhost:3000;
   }

   server {
     listen 80;
     server_name yourdomain.com;

     location /api {
       proxy_pass http://backend;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }

     location / {
       proxy_pass http://frontend;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/linkedinbot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d yourdomain.com
   ```

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] LinkedIn credentials tested
- [ ] OpenAI API key tested
- [ ] News sources accessible
- [ ] Posting times set correctly
- [ ] System tested locally
- [ ] Logs reviewed for errors
- [ ] Backups configured
- [ ] Monitoring setup

## 🔒 Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables not in code
- [ ] Database password strong
- [ ] Redis password set
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Credentials encrypted
- [ ] Regular backups scheduled
- [ ] Monitoring alerts configured
- [ ] Access logs reviewed

## 📊 Monitoring & Maintenance

### Setup Monitoring

**Uptime Monitoring:**
```bash
# UptimeRobot (free)
# Monitor: https://yourdomain.com/api/health
# Alert on down
```

**Error Tracking:**
```bash
# Sentry (free tier)
# Add to backend:
import sentry_sdk
sentry_sdk.init("your-sentry-dsn")
```

**Log Aggregation:**
```bash
# Papertrail or LogRocket
# Stream logs from production
```

### Daily Maintenance

- Check system status dashboard
- Review job logs
- Monitor posting success rate
- Check error logs

### Weekly Maintenance

- Review posted content quality
- Check engagement metrics
- Update news sources if needed
- Backup database

### Monthly Maintenance

- Rotate API keys
- Update dependencies
- Review and optimize costs
- Analyze performance metrics

## 🚨 Troubleshooting Production

### Check Service Status
```bash
# SSH into server
ssh user@your-server

# Check Docker containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check database
docker-compose exec backend npx prisma studio
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Database Issues
```bash
# Backup database
docker-compose exec postgres pg_dump -U linkedinbot linkedinbot > backup.sql

# Restore database
docker-compose exec -T postgres psql -U linkedinbot linkedinbot < backup.sql
```

### Clear Cache/Logs
```bash
# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# Clear old logs
docker-compose exec backend rm -f logs/*.log
```

## 📈 Scaling

### Horizontal Scaling
- Add multiple backend instances behind load balancer
- Use managed PostgreSQL for better performance
- Use managed Redis for better reliability

### Vertical Scaling
- Increase VPS resources (CPU, RAM)
- Upgrade database tier
- Increase Redis memory

## 💰 Cost Optimization

- Use free tier services where possible
- Monitor resource usage
- Set up alerts for unusual activity
- Use spot instances for non-critical workloads
- Consolidate services on single VPS if possible

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway up
```

## 📞 Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Render Docs:** https://render.com/docs
- **DigitalOcean Docs:** https://docs.digitalocean.com
- **Docker Docs:** https://docs.docker.com
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Node.js Best Practices:** https://nodejs.org/en/docs/guides/

## 🎉 Deployment Complete!

Your LinkedIn bot is now live and ready to automate posting for DigitalKarvan!

Monitor the dashboard regularly and adjust settings as needed for optimal performance.
