# Hifzer Project Handoff

Last updated: 2026-04-14
Audience: New engineers, designers, PMs, and coding agents

## 1. What Hifzer Is Now

Hifzer started as a hifz-focused product, but the current app is broader.

Today it is best described as a Qur'an-centered companion with multiple connected lanes:

- Qur'an reading and continuity
- hifz sessions and SRS review
- official Quran.com enrichment and bookmark sync
- grounded AI ayah explanation
- private journaling
- dua modules and personal dua management
- practice drills and fluency improvement
- milestones, reminders, settings, billing, and support

The product is still serious about memorization quality, but it is no longer only a memorization tool.

## 2. Current Operational Truths

These points should anchor how you reason about the app:

- Clerk is the primary auth system.
- Quran.com is an optional linked account, not a primary auth system.
- `/dashboard` is the signed-in home.
- There is no current `/today` route.
- `/session` is currently a redirect alias to `/hifz`.
- Local Qur'an data is the baseline; Quran.com enriches on top of it.
- The AI explanation flow is optional and externalized through the Cloudflare Worker.
- Historical audits remain in the repo, but they are not the current spec.

## 3. Route Model

### Public

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

### Auth

- `/login`
- `/signup`
- `/forgot-password`

### Onboarding

- `/onboarding/welcome`
- `/onboarding/start-point`
- `/onboarding/assessment`
- `/onboarding/fluency-check`
- `/onboarding/plan-preview`
- `/onboarding/permissions`
- `/onboarding/complete`

### Main App

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

### Legacy

- `/legacy/*`
- `/app` and `/app/*` redirect into `/legacy/*`
- `/sign-in` redirects to `/legacy/sign-in`

Important current truth:

- auth redirects should land on `/dashboard`

## 4. Product Surface Summary

### Dashboard

The dashboard is the post-auth home. It summarizes:

- current practice status
- quick actions into hifz, Qur'an, dua, and journal
- streak and recent practice
- review health
- Qur'an progress
- first-run guidance for newly onboarded users

### Qur'an

The Qur'an lane is one of the deepest surfaces in the product:

- hub with continue reading, completion, plan, surah progress, jump tools, and backfill
- reader in list and compact modes
- saved reader filter preferences
- translations and phonetics
- official Quran.com content enrichment
- official tafsir selection
- official reciter catalog and audio fallback
- AI explanation for a single ayah
- smart bookmarks with notes and categories
- glossary search

### Hifz

The hifz lane still contains the core session engine:

- SRS queue construction
- graded ayah attempts
- review events
- quality gates
- weak-transition repair
- hifz progress view

### Practice + Fluency

These are support lanes around memorization and recitation quality:

- rescue sessions
- mushabihat radar
- seam trainer
- meaning-linked memorization cues
- listening-led recitation loops
- hesitation cleanup
- transition smoothing
- fluency retest

### Dua

The dua system includes:

- module-based dua experiences
- deck ordering
- custom dua creation and persistence

### Journal

The journal is a meaningful part of the product now:

- private notes
- ayah-linked entries
- dua-linked entries
- account sync when available
- degraded local fallback if sync fails

### Settings / Support / Billing

Operational product surfaces include:

- language
- display
- reminders
- reciter selection
- plan and account
- Quran.com connection
- roadmap and feedback surfaces
- support flows
- Paddle-backed upgrade and manage flows

## 5. Route Groups And Layouts

Active route groups:

- `src/app/(public)`
- `src/app/(auth)`
- `src/app/(onboarding)`
- `src/app/(app)`
- `src/app/api`
- `src/app/legacy`

The repo still contains `src/_legacy` implementation code, but the preserved legacy route surface lives under `src/app/legacy`.

## 6. Domain Map

Main domain services under `src/hifzer`:

- `ai`
  App-side AI contracts and gateway config.
- `audio`
  Reciter mapping and local audio URL resolution.
- `bookmarks`
  Bookmark persistence and sync glue.
- `dashboard`
  Aggregated dashboard overview.
- `focus`
  Distraction-free and reading-mode behavior.
- `i18n`
  UI language and copy.
- `journal`
  Private journal persistence and degraded fallback.
- `profile`
  User profile creation, compat handling, and snapshot access.
- `progress`
  Qur'an and hifz progress summaries.
- `quran`
  Reader, lookup, translation, data, and progress logic.
- `quran-foundation`
  Quran.com OAuth, status, bookmark sync, and official content enrichment.
- `ramadan`
  Dua content and module structures.
- `recitation`
  Practice and fluency intelligence.
- `srs`
  Queue generation and update logic.
- `streak`
  Current streak computation and qualification.
- `theme`
  App theme presets and visual variants.

## 7. Persistence Model

`prisma/schema.prisma` now covers much more than the original hifz core.

Persisted models include:

- `UserProfile`
- `Session`
- `AyahAttempt`
- `AyahReview`
- `WeakTransition`
- `ReviewEvent`
- `QualityGateRun`
- `QuranBrowseEvent`
- `QuranReaderFilterPreference`
- `BookmarkCategory`
- `Bookmark`
- `BookmarkEvent`
- `QuranFoundationAccount`
- `PrivateJournalEntry`
- `CustomDua`
- `DuaDeckOrder`
- subscription and billing-related fields on `UserProfile`

There are also teacher-circle models in the schema:

- `TeacherCircle`
- `TeacherCircleMember`
- `TeacherCircleWeeklyCheck`

Those exist in persistence, but there is no equivalent top-level app surface yet. Treat them as groundwork rather than a current launched feature.

## 8. Integrations

### Clerk

Clerk protects app and onboarding flows when configured.

Current redirect expectation:

- sign in -> `/dashboard`
- sign up -> `/dashboard`

Important:

- public auth URLs stay `/login` and `/signup`
- `/sign-in` is reserved for legacy redirect behavior

Runbook:

- `clerk-reset-runbook.md`

### Quran.com / Quran Foundation

Current shipped behavior:

- optional Quran.com linking from onboarding completion, `/quran`, and settings
- bookmark push/import/reconcile sync
- official content enrichment for the reader
- official translation and tafsir selection
- official reciter catalog and audio fallback

Current limitation:

- broader user scopes like reading sessions, preference sync, goals, activity days, collections, and notes are not yet fully integrated in the live app

Current env naming:

- prefer explicit names for new setup:
  - `QF_OAUTH_CLIENT_ID`
  - `QF_OAUTH_CLIENT_SECRET`
  - `QF_USER_TOKEN_ENCRYPTION_SECRET`
  - `QF_CONTENT_CLIENT_ID`
  - `QF_CONTENT_CLIENT_SECRET`
  - `QF_OAUTH_REDIRECT_URI`
- older generic names still work as fallback:
  - `QF_CLIENT_ID`
  - `QF_CLIENT_SECRET`
  - `QF_TOKEN_ENCRYPTION_SECRET`

Operational entry points:

- `/api/quran-foundation/status`
- `/settings/quran-foundation`
- `/api/quran-foundation/connect`
- `/api/quran-foundation/bookmarks/push`
- `/api/quran-foundation/bookmarks/hydrate`
- `/api/quran-foundation/bookmarks/reconcile`

### AI

Current AI explanation architecture:

- app route: `POST /api/quran/ai-explain`
- worker: `workers/ai-gateway`
- grounding source: Quran MCP
- provider strategy: provider-aware, Gemini-first by default, Groq optional

Important operational truth:

- the Worker `/health` endpoint is protected by the shared bearer secret

Current app envs:

- `HIFZER_AI_GATEWAY_URL`
- `HIFZER_AI_GATEWAY_TOKEN`
- `HIFZER_AI_GATEWAY_TIMEOUT_MS`

Current worker envs:

- `AI_GATEWAY_SHARED_SECRET`
- `AI_PROVIDER=gemini` default
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `QURAN_MCP_URL`

Optional worker envs for Groq:

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_FORMAT_MODEL`

Runbooks:

- `ai-gateway-cloudflare-setup.md`
- `../workers/ai-gateway/README.md`

### Audio

Audio uses a local-first model with Quran.com fallback:

- local audio resolves from `NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL`
- local default reciter resolves from `NEXT_PUBLIC_HIFZER_DEFAULT_RECITER_ID`
- official Quran.com reciters stream through the content API instead of the local bucket

Runbook:

- `r2-first-time-setup.md`

### Email

Reminder email flows use Resend.

### Billing

Upgrade and customer-management surfaces are wired around Paddle.

### Monitoring

Current observability:

- Sentry
- Vercel Analytics
- Vercel Speed Insights

## 9. Operational Smoke Tests

Use these first before deep debugging:

### Build

```bash
pnpm install
pnpm run build
```

### Dashboard

```bash
curl -i https://your-app-domain.com/api/dashboard/overview
```

### Quran.com status

```bash
curl https://your-app-domain.com/api/quran-foundation/status
```

### Qur'an content

```bash
curl "https://your-app-domain.com/api/quran/content-panel?ayahId=1"
curl "https://your-app-domain.com/api/quran/audio-source?ayahId=1&reciterId=alafasy"
```

### AI explanation

```bash
curl -X POST https://your-app-domain.com/api/quran/ai-explain \
  -H 'content-type: application/json' \
  --data '{"ayahId":1}'
```

### Worker health

```bash
curl https://your-worker.your-subdomain.workers.dev/health \
  -H "authorization: Bearer YOUR_SHARED_SECRET"
```

### Local audio

```bash
curl -I https://your-audio-domain.com/alafasy/000001.mp3
```

## 10. Known Historical Drift In Docs

The repo intentionally keeps historical audits and reports, but many are no longer current.

Common stale assumptions in older docs:

- `/today` still exists
- Hifzer is only a hifz system
- Groq is the only AI provider or the default live path
- the product is mostly landing + onboarding + session + browser
- legacy code lives only under `src/_legacy`

When you see conflicts, trust current code first, then:

1. `../AGENTS.md`
2. `../README.md`
3. this handoff
4. `operational-troubleshooting.md`
5. current feature runbooks

Historical audit files under `docs/audits/**` should be treated as archival snapshots, not as the current spec.

## 11. Recommended Reading For New Contributors

1. `../AGENTS.md`
2. `../README.md`
3. `HIFZER_PROJECT_HANDOFF.md`
4. `operational-troubleshooting.md`
5. `README.md` inside `workers/ai-gateway` if touching AI
6. specific runbooks only when working in those areas
