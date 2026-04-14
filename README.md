# Hifzer

Hifzer is a Qur'an-centered web app with one signed-in home and multiple connected lanes: Qur'an reading, hifz review, memorization support, dua, private journaling, practice drills, fluency work, milestones, reminders, and support tools.

The product is no longer a narrow hifz tracker. The current app is better described as a Qur'an companion with hifz at the center and reading continuity around it.

## Current Product Shape

Live user-facing surfaces:

- `Dashboard`
  Post-auth home with quick actions, streaks, review health, recent practice, and Qur'an continuity.
- `Qur'an`
  Hub, reader, progress, bookmarks, glossary, official enrichment, official audio/reciters, and grounded AI explanation.
- `Hifz`
  Session engine, SRS review, quality gates, weak-transition repair, and progress.
- `Practice`
  Rescue sessions, mushabihat radar, seam trainer, and meaning-linked support.
- `Fluency`
  Listening-led loops, hesitation cleanup, transition smoothing, and retest flow.
- `Dua`
  Guided dua modules, user-managed custom duas, and deck ordering.
- `Journal`
  Private notes with ayah/dua links, account sync, and safe degraded fallback.
- `Milestones`, `Notifications`, `Settings`, `Billing`, `Support`
  The rest of the operating surface around the core app.

## Route Model

Public routes:

- `/`
- `/compare`
- `/changelog`
- `/motivation`
- `/pay`
- `/quran-preview`
- `/welcome`
- `/legal`
- `/legal/privacy`
- `/legal/terms`
- `/legal/refund-policy`
- `/legal/sources`
- `/unsubscribe`

Auth routes:

- `/login`
- `/signup`
- `/forgot-password`

Onboarding routes:

- `/onboarding/welcome`
- `/onboarding/start-point`
- `/onboarding/assessment`
- `/onboarding/fluency-check`
- `/onboarding/plan-preview`
- `/onboarding/permissions`
- `/onboarding/complete`

Main app routes:

- `/dashboard`
- `/hifz`
- `/hifz/progress`
- `/session` -> redirect alias to `/hifz`
- `/quran`
- `/quran/read`
- `/quran/bookmarks`
- `/quran/glossary`
- `/quran/progress`
- `/quran/surah/[id]`
- `/quran/juz/[id]`
- `/dua`
- `/dua/[moduleId]`
- `/dua/[moduleId]/deck`
- `/journal`
- `/practice`
- `/fluency`
- `/fluency/lesson/[id]`
- `/fluency/retest`
- `/milestones`
- `/notifications`
- `/ramadan`
- `/roadmap`
- `/settings`
- `/settings/account`
- `/settings/display`
- `/settings/language`
- `/settings/plan`
- `/settings/quran-foundation`
- `/settings/reciter`
- `/settings/reminders`
- `/support`
- `/billing/upgrade`
- `/billing/manage`
- `/billing/success`
- `/billing/thank-you`

Legacy namespace retained for compatibility:

- `/legacy/*`
- `/app` and `/app/*` redirect into `/legacy/*`
- `/sign-in` redirects to `/legacy/sign-in`

Important:

- There is no current `/today` page.
- Post-auth redirects should land on `/dashboard`.

## Architecture Snapshot

Top-level code map:

- `src/app`
  App Router route groups, layouts, and API routes.
- `src/hifzer`
  Product/domain services.
- `src/components`
  App shell, landing, Qur'an UI, settings, billing, providers, and primitives.
- `workers/ai-gateway`
  Cloudflare Worker for grounded Qur'an AI.
- `prisma/schema.prisma`
  Persistence model.

Key domain modules:

- `src/hifzer/quran`
- `src/hifzer/srs`
- `src/hifzer/recitation`
- `src/hifzer/bookmarks`
- `src/hifzer/journal`
- `src/hifzer/quran-foundation`
- `src/hifzer/dashboard`
- `src/hifzer/streak`
- `src/hifzer/ai`
- `src/hifzer/ramadan`
- `src/hifzer/profile`
- `src/hifzer/audio`

## Current Integrations

### Clerk

Clerk is the primary auth layer. Quran.com is an optional linked account, not a replacement auth system.

Recommended redirect contract:

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard`

Runbook:

- `docs/clerk-reset-runbook.md`

### Database

Hifzer uses Prisma v7 + Postgres/Neon.

Core persisted areas include:

- user profile and onboarding state
- hifz sessions and attempts
- SRS review state and weak transitions
- Qur'an browse events and streak state
- bookmarks and bookmark sync state
- Quran.com linked account state
- reader filter preferences
- journal entries
- custom duas and deck order
- billing/subscription state

Useful commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:studio
```

### Quran.com / Quran Foundation

Current live integration:

- optional Quran.com linking from onboarding completion, `/quran`, and `/settings/quran-foundation`
- bookmark push/import/reconcile sync
- official content enrichment in the reader
- official translation and tafsir selection
- official audio sources and Quran.com reciters

Current limitation:

- broader user APIs like reading sessions, preferences sync, goals, activity days, and notes are not fully wired yet

Preferred env names:

- `QF_OAUTH_CLIENT_ID`
- `QF_OAUTH_CLIENT_SECRET`
- `QF_USER_TOKEN_ENCRYPTION_SECRET`
- `QF_CONTENT_CLIENT_ID`
- `QF_CONTENT_CLIENT_SECRET`
- `QF_OAUTH_REDIRECT_URI`
- `QF_BOOKMARK_MUSHAF_ID`
- `QF_CONTENT_TRANSLATION_RESOURCE_ID`
- `QF_CONTENT_TAFSIR_RESOURCE_ID`

Backward-compatible fallback names still work:

- `QF_CLIENT_ID`
- `QF_CLIENT_SECRET`
- `QF_TOKEN_ENCRYPTION_SECRET`

First status check:

```bash
curl https://your-app-domain.com/api/quran-foundation/status
```

### AI Gateway

The current AI explanation path is:

- Next.js app route: `POST /api/quran/ai-explain`
- Cloudflare Worker: `workers/ai-gateway`
- grounding source: Quran MCP (`https://mcp.quran.ai`)
- provider model: provider-aware, Gemini-first by default, Groq optional

Key app env vars:

- `HIFZER_AI_GATEWAY_URL`
- `HIFZER_AI_GATEWAY_TOKEN`
- `HIFZER_AI_GATEWAY_TIMEOUT_MS` optional

Key worker env vars:

- `AI_GATEWAY_SHARED_SECRET`
- `AI_PROVIDER=gemini` default
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `QURAN_MCP_URL`

Optional worker vars for Groq:

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_FORMAT_MODEL`

Runbooks:

- `workers/ai-gateway/README.md`
- `docs/ai-gateway-cloudflare-setup.md`

### Email

Resend powers reminder emails.

Key env vars:

- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_UNSUBSCRIBE_SIGNING_SECRET`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`

### Billing

Paddle powers upgrade/support flows.

Key env vars:

- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`

### Audio

Qur'an audio is local-first with Quran.com fallback:

- local audio comes from `NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL`
- the default local reciter resolves from `NEXT_PUBLIC_HIFZER_DEFAULT_RECITER_ID`
- official Quran.com reciters stream through the content API instead of R2

Runbook:

- `docs/r2-first-time-setup.md`

### Observability

Current observability stack:

- Sentry for app errors and exception capture
- Vercel Analytics for usage analytics
- Vercel Speed Insights for performance telemetry

Operational runbook:

- `docs/operational-troubleshooting.md`

## Local Qur'an Data

Main checked-in data files:

- `src/hifzer/quran/data/ayahs.full.json`
- `src/hifzer/quran/data/quran-data.js`
- `src/hifzer/quran/data/surah-index.ts`
- `src/hifzer/quran/data/translations/en.sahih.by-ayah-id.json`

Useful generation commands:

```bash
node scripts/generate-surah-index.mjs
pnpm quran:translation:sahih
```

More details:

- `src/hifzer/quran/data/SOURCES.md`

## Development

Install and run:

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:e2e:routing
pnpm audit:clicks
pnpm audit:mobile:overflow
pnpm ai:worker:dev
pnpm ai:worker:deploy:dry
```

Progress simulation harnesses:

```bash
pnpm test:progress:week
pnpm test:progress:14d
pnpm test:progress:failures
```

## Troubleshooting Quick Start

### Auth looks broken

Check:

- `/login`
- `/signup`
- Clerk env vars in deployment
- `docs/clerk-reset-runbook.md`

Expected:

- signed-out protected routes redirect to `/login`
- sign-in and sign-up land on `/dashboard`

### Dashboard says unavailable

Check:

```bash
curl -i https://your-app-domain.com/api/dashboard/overview
```

Likely causes:

- unauthenticated request -> `401`
- database not configured -> `503`
- server-side failure -> `500`

### Quran.com linking is failing

Check:

```bash
curl https://your-app-domain.com/api/quran-foundation/status
```

Look for:

- `userApiReady`
- `contentApiReady`
- `state`
- `detail`

Common causes:

- missing OAuth env vars
- missing token encryption secret
- callback URL mismatch
- latest DB migrations not applied

### Reader enrichment is broken

Smoke tests:

```bash
curl "https://your-app-domain.com/api/quran/content-panel?ayahId=1"
curl "https://your-app-domain.com/api/quran/audio-source?ayahId=1&reciterId=alafasy"
```

Common causes:

- content client env vars missing
- Quran.Foundation token scope or API-side availability issue
- requested reciter not available for that provider

### AI explanation is unavailable

Smoke tests:

```bash
curl -X POST https://your-app-domain.com/api/quran/ai-explain \
  -H 'content-type: application/json' \
  --data '{"ayahId":1}'
```

If the app route is configured, then verify the Worker directly:

```bash
curl https://your-worker.your-subdomain.workers.dev/health \
  -H "authorization: Bearer YOUR_SHARED_SECRET"
```

Common causes:

- `HIFZER_AI_GATEWAY_URL` missing
- `HIFZER_AI_GATEWAY_TOKEN` mismatch
- Worker missing `GEMINI_API_KEY`
- Quran MCP upstream unavailable

### Local audio is missing

Check:

```bash
curl -I https://your-audio-domain.com/alafasy/000001.mp3
```

Common causes:

- `NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL` unset
- bad R2 key naming
- CORS misconfiguration
- local file missing for selected reciter

## Docs To Read First

- `AGENTS.md`
- `docs/README.md`
- `docs/HIFZER_PROJECT_HANDOFF.md`
- `docs/operational-troubleshooting.md`

Important:

- `docs/audits/**`, `docs/mobile-ui-audit-report.md`, and `docs/performance-mobile-audit.md` are historical snapshots. They are useful for background, but they are not current product truth.
