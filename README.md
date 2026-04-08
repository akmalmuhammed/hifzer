# Hifzer

Hifzer is a Qur'an-centered web app that has grown beyond its original hifz-only plan into a broader companion product: Qur'an reading, hifz review, memorization support, dua, private journaling, practice drills, fluency work, milestones, reminders, and support tools all live in one app.

## Current Product Shape

User-facing surfaces that exist today:

- `Dashboard`
  Daily overview, KPIs, streaks, review health, Qur'an progress, and quick actions.
- `Qur'an`
  Hub, reader, smart bookmarks, glossary, progress, jump tools, progress backfill, official tafsir, and grounded AI explanation.
- `Hifz`
  Session engine, SRS review, quality gates, and memorization flow.
- `Practice`
  Rescue sessions, mushabihat radar, seam trainer, and meaning-linked memorization cues.
- `Fluency`
  Listening-led loops, hesitation cleanup, transition smoothing, and retest flow.
- `Dua`
  Guided dua modules plus user-managed custom duas and deck ordering.
- `Journal`
  Private notes with ayah and dua attachments, account sync, and local fallback.
- `Milestones`, `Notifications`, `Settings`, `Billing`, `Support`
  The rest of the operating surface around the core product.

The public-site message has also shifted: Hifzer is now pitched more as an all-in-one Qur'an companion than a narrow memorization tracker.

## Route Map

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
- `/session` -> redirects to `/hifz`
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

## Architecture

Top-level code map:

- `src/app`
  App Router route groups, layouts, and API routes.
- `src/hifzer`
  Product/domain services.
- `src/components`
  App shell, landing, Qur'an UI, settings, billing, providers, and primitives.
- `workers/ai-gateway`
  Cloudflare Worker for grounded AI.
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

## Integrations

### Clerk

Clerk is enabled when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set.

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

- linked Quran.com account in `/settings/quran-foundation`
- bookmark push/import sync
- official content enrichment in the reader
- official tafsir selection in reader filters

Important current limitation:

- the app currently requests bookmark-oriented user scopes, not the full broader Quran.com user-API surface

Key env vars:

- `QF_CLIENT_ID`
- `QF_CLIENT_SECRET`
- `QF_TOKEN_ENCRYPTION_SECRET`
- `QF_OAUTH_REDIRECT_URI`
- `QF_BOOKMARK_MUSHAF_ID`
- `QF_CONTENT_TRANSLATION_RESOURCE_ID`
- `QF_CONTENT_TAFSIR_RESOURCE_ID`

### AI Gateway

The current AI explanation path is:

- Next.js app route: `POST /api/quran/ai-explain`
- Cloudflare Worker: `workers/ai-gateway`
- default provider: Groq
- grounding source: Quran MCP (`https://mcp.quran.ai`)

Key app env vars:

- `HIFZER_AI_GATEWAY_URL`
- `HIFZER_AI_GATEWAY_TOKEN`
- `HIFZER_AI_GATEWAY_TIMEOUT_MS` (optional)

Key worker env vars:

- `AI_GATEWAY_SHARED_SECRET`
- `AI_PROVIDER=groq`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_FORMAT_MODEL`
- `QURAN_MCP_URL`

Provider fallback code for Gemini still exists, but Groq is the current default.

Runbooks:

- `workers/ai-gateway/README.md`
- `docs/ai-gateway-cloudflare-setup.md`

### Email

Resend is used for reminder emails.

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

Qur'an audio is designed around a Cloudflare R2-compatible public base URL.

Key env vars:

- `NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL`
- `NEXT_PUBLIC_HIFZER_DEFAULT_RECITER_ID`
- `NEXT_PUBLIC_HIFZER_AUDIO_AYAH_ID_WIDTH`

Runbook:

- `docs/r2-first-time-setup.md`

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
```

Progress simulation harnesses:

```bash
pnpm test:progress:week
pnpm test:progress:14d
pnpm test:progress:failures
```

## Docs To Read First

- `AGENTS.md`
- `docs/HIFZER_PROJECT_HANDOFF.md`
- `docs/README.md`

Important:

- `docs/audits/**`, `docs/mobile-ui-audit-report.md`, and `docs/performance-mobile-audit.md` are historical snapshots. They are useful for background, but they are not current product truth.
