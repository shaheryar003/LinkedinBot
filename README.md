# LinkedIn Automation Bot for DigitalKarvan

An automated LinkedIn bot that fetches trending tech news, generates engaging posts using AI, and publishes them to your LinkedIn page automatically.

## Features

- 🤖 **Automated News Fetching**: Pulls trending tech news from TechCrunch, Hacker News, and Dev.to
- ✨ **AI-Powered Content Generation**: Uses OpenAI to create 5-6 engaging post variations
- 📝 **Draft Approval System**: Review and approve posts before they go live
- 🔄 **Dual Posting Methods**: Supports both Puppeteer browser automation and LinkedIn API
- ⏰ **Scheduled Posting**: Automatically posts at configured times (default: 9 AM & 3 PM)
- 📊 **Dashboard**: Monitor system status, pending drafts, and posting history
- 🎨 **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## Tech Stack

### Backend
- Node.js + TypeScript
- Express.js
- Prisma ORM + PostgreSQL
- Bull Queue + Redis
- Puppeteer for LinkedIn automation
- OpenAI API for content generation

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query
- Axios

## Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- OpenAI API key
- LinkedIn account credentials

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd LinkedinBot
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# DATABASE_URL, REDIS_URL, OPENAI_API_KEY, LINKEDIN_EMAIL, LINKEDIN_PASSWORD, etc.

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start the backend
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Start the frontend
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Docker Setup

Alternatively, use Docker Compose to run everything:

```bash
# Copy and configure environment files
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

## Configuration

### Settings Page

Navigate to the Settings page in the UI to configure:

1. **LinkedIn Credentials**
   - Choose posting method (Puppeteer or API)
   - Enter email/password for Puppeteer
   - Or configure API token for LinkedIn API

2. **OpenAI API Key**
   - Enter your OpenAI API key
   - Test the connection

3. **Posting Schedule**
   - Set two daily posting times
   - Default: 9:00 AM and 3:00 PM

4. **System Status**
   - Toggle system on/off

## Usage

### Automated Workflow

1. **6:00 AM**: System fetches latest tech news
2. **6:30 AM**: AI generates 5-6 post variations for each article
3. **User Review**: Review and approve drafts in the Drafts page
4. **9:00 AM & 3:00 PM**: Approved posts are automatically published

### Manual Actions

- **Fetch News**: Manually trigger news fetching
- **Generate Drafts**: Create drafts from unused articles
- **Post Now**: Immediately post an approved draft
- **Edit Drafts**: Modify AI-generated content before approval

## Project Structure

```
LinkedinBot/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, Redis, OpenAI config
│   │   ├── services/       # Business logic
│   │   ├── controllers/    # API controllers
│   │   ├── routes/         # Express routes
│   │   ├── jobs/           # Scheduled jobs
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utilities
│   └── prisma/
│       └── schema.prisma   # Database schema
├── frontend/
│   └── src/
│       ├── app/            # Next.js pages
│       ├── components/     # React components
│       └── lib/            # API client & utilities
└── docker-compose.yml
```

## API Endpoints

### Drafts
- `GET /api/drafts` - Get all drafts
- `PUT /api/drafts/:id/approve` - Approve a draft
- `PUT /api/drafts/:id/reject` - Reject a draft
- `PUT /api/drafts/:id/edit` - Edit draft content
- `POST /api/drafts/generate` - Generate new drafts

### Posts
- `GET /api/posts` - Get posting history
- `POST /api/posts/:draftId/post-now` - Post immediately

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings
- `POST /api/settings/test-linkedin` - Test LinkedIn connection
- `POST /api/settings/test-openai` - Test OpenAI connection

### News
- `GET /api/news` - Get fetched articles
- `POST /api/news/fetch` - Fetch news manually

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/linkedinbot
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
JWT_SECRET=your-secret
ENCRYPTION_KEY=32-byte-hex-key
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# LinkedIn Puppeteer
LINKEDIN_EMAIL=your-email@example.com
LINKEDIN_PASSWORD=your-password

# LinkedIn API (optional)
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_ACCESS_TOKEN=your-token
LINKEDIN_ORGANIZATION_ID=your-org-id

# Schedule
POSTING_TIMES=09:00,15:00
TIMEZONE=America/New_York
PAGE_URL=DigitalKarvan
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Troubleshooting

### Puppeteer Issues

If Puppeteer fails to launch:
- Ensure Chrome/Chromium is installed
- Check headless mode settings
- Review screenshots in `backend/screenshots/`

### LinkedIn Login Fails

- Verify credentials are correct
- Check for CAPTCHA or 2FA requirements
- Try switching to LinkedIn API method

### Jobs Not Running

- Verify Redis is running
- Check job logs in database
- Ensure system is active in settings

## Security Notes

- All credentials are encrypted at rest
- Use environment variables for sensitive data
- Enable HTTPS in production
- Regularly rotate API keys
- Monitor for unusual activity

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ for DigitalKarvan
