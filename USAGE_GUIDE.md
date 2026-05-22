# LinkedIn Automation Bot — Usage Guide

A practical, day-to-day guide for operating the LinkedIn Automation Bot for DigitalKarvan. This document walks through first-time setup, the daily workflow, manual controls, and what to do when something goes wrong.

---

## 1. Who This Guide Is For

- **Content managers** approving and editing AI-generated LinkedIn posts.
- **Operators** configuring credentials, schedules, and posting methods.
- **Developers / admins** running the system locally or in production.

If you only want to approve posts each morning, skip to **Section 4: Daily Workflow**.

---

## 2. First-Time Setup

### 2.1 Prerequisites

Make sure the following are installed and running:

- Node.js 18+
- PostgreSQL
- Redis
- An OpenAI API key
- A LinkedIn account with publishing rights to the DigitalKarvan page

### 2.2 Install and Run

```bash
# Clone the repo
git clone <repository-url>
cd LinkedinBot

# Backend
cd backend
npm install
cp .env.example .env       # fill in credentials
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### 2.3 Docker (alternative)

```bash
cp backend/.env.example backend/.env
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

### 2.4 Configure in the UI

Go to **Settings** in the frontend and set:

1. **LinkedIn credentials**
   - Choose posting method: **Puppeteer** (browser automation) or **API** (official LinkedIn API).
   - Puppeteer needs email + password.
   - API needs Client ID, Client Secret, Access Token, and Organization ID.
2. **OpenAI API key** — paste your key and click **Test Connection**.
3. **Posting schedule** — set two daily posting times (default: 09:00 and 15:00).
4. **System status** — toggle the system **Active** to enable automated runs.

Click **Test LinkedIn** and **Test OpenAI** before activating. Both must pass.

---

## 3. How the System Works (Mental Model)

```
News Sources → AI Generator → Drafts (you approve) → Scheduled Posts → LinkedIn
```

Four stages, three of them automated:

| Stage             | When            | Who    | Output                                |
|-------------------|-----------------|--------|---------------------------------------|
| Fetch news        | 06:00 daily     | System | Articles stored in DB                 |
| Generate drafts   | 06:30 daily     | System | 5–6 post variations per article       |
| Review & approve  | Anytime         | You    | Drafts marked APPROVED                |
| Publish           | 09:00 & 15:00   | System | Posts go live on LinkedIn             |

If no drafts are approved by posting time, nothing is posted — the system never publishes unreviewed content.

---

## 4. Daily Workflow

### 4.1 Morning Review (5–10 minutes)

1. Open **Drafts** in the UI.
2. You'll see articles fetched overnight, each with 5–6 post variations grouped together.
3. For each article:
   - Read the variations (question, insight, story, data, opinion, community angles).
   - **Approve** the 1–2 you like best.
   - **Edit** any draft inline if the wording needs tweaking.
   - **Reject** the rest.
4. Aim for **2 approved drafts per day** — one for the 9 AM slot, one for the 3 PM slot.

### 4.2 Throughout the Day

- The system posts automatically at the scheduled times.
- Check **History** to confirm posts went live.
- The system logs both successes and failures; failed posts show the error reason.

### 4.3 End of Day

- Glance at **Dashboard** for the day's stats.
- If any post failed, retry from **Drafts** using **Post Now**.

---

## 5. Manual Controls

The UI exposes manual overrides for everything the scheduler does:

| Action            | Where         | What it does                                      |
|-------------------|---------------|---------------------------------------------------|
| Fetch News        | Dashboard     | Pulls fresh articles immediately                  |
| Generate Drafts   | Dashboard     | Creates new drafts from unused articles           |
| Edit Draft        | Drafts page   | Inline edit before approval                       |
| Approve / Reject  | Drafts page   | Move draft to APPROVED or REJECTED                |
| Post Now          | Drafts page   | Publish an approved draft immediately             |
| Test LinkedIn     | Settings      | Validate LinkedIn credentials                     |
| Test OpenAI       | Settings      | Validate OpenAI API key                           |
| Toggle System     | Settings      | Pause / resume all automation                     |

---

## 6. Tuning Content Quality

The AI generates six "angles" per article. Over the first 2–3 weeks, watch which angles get the most engagement on LinkedIn:

- **Question** — opens with a hook question.
- **Insight** — leads with a takeaway or observation.
- **Story** — narrative framing.
- **Data** — leans on numbers / stats.
- **Opinion** — takes a stance.
- **Community** — invites discussion.

Approve the angles that perform; reject the ones that don't. Patterns will emerge quickly.

Tips:
- Edit drafts to add your own voice — the AI gets you 80% there.
- Keep posts in the 150–300 word range (LinkedIn's sweet spot).
- Trim hashtags to 3–5 of the most relevant ones.

---

## 7. API Reference (for integrations)

| Method | Endpoint                              | Purpose                          |
|--------|---------------------------------------|----------------------------------|
| GET    | `/api/drafts`                         | List all drafts                  |
| PUT    | `/api/drafts/:id/approve`             | Approve a draft                  |
| PUT    | `/api/drafts/:id/reject`              | Reject a draft                   |
| PUT    | `/api/drafts/:id/edit`                | Edit draft content               |
| POST   | `/api/drafts/generate`                | Generate new drafts              |
| GET    | `/api/posts`                          | Posting history                  |
| POST   | `/api/posts/:draftId/post-now`        | Publish immediately              |
| GET    | `/api/settings`                       | Read settings                    |
| PUT    | `/api/settings`                       | Update settings                  |
| POST   | `/api/settings/test-linkedin`         | Test LinkedIn connection         |
| POST   | `/api/settings/test-openai`           | Test OpenAI connection           |
| GET    | `/api/news`                           | List fetched articles            |
| POST   | `/api/news/fetch`                     | Trigger a news fetch             |

---

## 8. Troubleshooting

### LinkedIn login fails (Puppeteer)
- Verify credentials in **Settings**.
- Look for CAPTCHA or 2FA prompts — switch to the LinkedIn API method if these appear.
- Check `backend/screenshots/` for the last login attempt's screenshot.

### Puppeteer won't launch
- Confirm Chrome / Chromium is installed.
- In headless environments, ensure required system libraries are present.

### Drafts not generating
- **Test OpenAI** in Settings — invalid keys are the most common cause.
- Check the OpenAI account has credit / quota remaining.
- Verify the news fetch ran (Dashboard → recent job logs).

### Posts not publishing on schedule
- Confirm Redis is running.
- Confirm the system toggle is **Active** in Settings.
- Look in **History** or job logs for the failure reason.
- Make sure at least one draft is **APPROVED** before the scheduled time.

### Wrong timezone
- Set `TIMEZONE` in `backend/.env` (e.g., `America/New_York`).
- Restart the backend after changing.

---

## 9. Operating in Production

- Set `NODE_ENV=production`.
- Use a managed PostgreSQL and Redis instance.
- Put the backend behind HTTPS / a reverse proxy.
- Rotate `JWT_SECRET`, `ENCRYPTION_KEY`, and API keys on a regular cadence.
- Back up the database at least weekly.
- Monitor `JobLog` for repeated failures.

See `DEPLOYMENT.md` for full production deployment options.

---

## 10. Security Notes

- All credentials (LinkedIn, OpenAI, API tokens) are encrypted at rest with AES-256.
- Never commit `.env` files.
- Use environment variables for all secrets.
- Keep the `ENCRYPTION_KEY` stable — rotating it invalidates stored credentials.

---

## 11. Getting Help

- Check **Dashboard** for system health and recent job runs.
- Review logs in `backend/logs/`.
- File an issue on the repository with: what you did, what you expected, what happened, and relevant log lines.
