# JobPilot

Job alert emails -> match score against your resume -> Telegram ping -> you approve or skip -> tailored resume + email draft -> send and track on a Kanban board.

Stack: React (Vite), Express, PostgreSQL, Redis + BullMQ, Gmail API, Anthropic API, Telegram bot.

## Quick start

Requirements: Node 20+. The API uses a persistent local database by default; Docker is not required for sign-up and the web app.

```bash
npm install                          # install backend, frontend, and root run tools
npm run dev                          # API on :4000 and frontend on :5173
```

The database schema is created automatically on API startup, and data persists in `backend/data`. To use PostgreSQL instead, set `DATABASE_URL` before starting the API. The background worker requires Redis; start it separately with `npm run worker` when Redis is available.

## First run without any integrations

1. Sign up on the website.
2. Resumes page: paste or upload your resume (the first one becomes the master).
3. Settings page: use "Add a test job", paste a real job description.
4. Without `ANTHROPIC_API_KEY` the score uses a simple keyword fallback; with it you get LLM scoring and reasons.
5. If the score is above your threshold the job appears on Review. Approve it, wait a minute, hit Refresh: the draft appears.

## Turning on each integration

- **Anthropic**: put `ANTHROPIC_API_KEY` in `.env`. Needed for alert parsing and drafting.
- **Gmail**: in Google Cloud Console create an OAuth client (Web app), add redirect URI `http://localhost:4000/api/gmail/callback`, enable the Gmail API, add yourself as a test user. Put the id/secret in `.env`, then use Settings -> Connect Gmail. Scopes: read mail and send mail.
- **Telegram**: create a bot with @BotFather, put the token in `.env`, restart the worker, message the bot `/start`, paste the chat id into Settings.

## How it works

- `worker.js` checks Gmail every `SYNC_MINUTES`, asks the LLM to extract postings from alert emails, saves new jobs, scores them, and pings Telegram above your threshold.
- Approve/Skip works from Telegram buttons or the Review page (same code path).
- Approving creates an application and queues a draft. Drafts only reword your real resume content; always read the tailored resume before sending.
- Sending uses Gmail if you filled in a recipient; otherwise it just marks the application as applied. A reply in the sent thread moves the card to "replied" on the next sync.

## Layout

```
backend/schema.sql        tables
backend/src/routes        REST API
backend/src/services      gmail, llm, matcher, telegram, pipeline
backend/src/worker.js     background jobs
frontend/src/pages        Dashboard, Review, Kanban, Resumes, Settings
```

## Not included yet

Analytics page beyond the dashboard chart, reminders UI (table exists), PDF export of tailored resumes, vector embeddings (scoring is LLM-based with a keyword fallback), and tests.
