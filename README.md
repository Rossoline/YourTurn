# YourTurn

Family time tracking app. Track who spends how much time with your child.

## Features

- **Timer** — switch between participants, track time per person with real-time sync across devices
- **Calendar** — monthly view with event planning, assign tasks to family members
- **Statistics** — daily breakdown, session history, period comparison (today / 7 / 14 / 30 days)
- **Family system** — create a family, invite members with a code, manage participants
- **Multi-device** — real-time sync via Supabase, optimistic locking for concurrent access
- **PWA** — installable on mobile, app icons, standalone mode

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase** (PostgreSQL, Auth, Real-time, RLS)
- **Tailwind CSS v4**
- **Google OAuth** via Supabase Auth
- **Sentry** for error tracking
- **Vercel** for deployment
- **GitHub Actions** CI

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Environment variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Optional:
```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Database

Run the SQL files in Supabase SQL Editor:
1. `supabase-schema.sql` — core tables (families, members, timer state)
2. `calendar_events.sql` — calendar events table

## Project structure

```
src/
  app/            — pages (timer, stats, login, signup, auth callback)
  components/     — UI components (Timer, Calendar, Toast, Skeleton, etc.)
  hooks/          — useTimer (real-time timer state)
  services/       — data layer (family, participant, timer, calendar, stats)
  utils/          — helpers (format, colors, throttle, rate limit)
  lib/supabase/   — Supabase client/server wrappers
  middleware.js   — auth protection + rate limiting
```

## Deployment

The `main` branch auto-deploys to Vercel. Development happens on `dev`.

```bash
git checkout dev     # work here
git push origin dev  # push changes
# when ready:
git checkout main && git merge dev && git push origin main
```
