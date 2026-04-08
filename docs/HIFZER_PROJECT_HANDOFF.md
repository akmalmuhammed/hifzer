# Hifzer Project Handoff

Last updated: 2026-04-08
Audience: New engineers, designers, PMs, and coding agents

## 1. What Hifzer Is Now

Hifzer started as a hifz-focused product, but the current app is broader.

Today it is best described as a Qur'an-centered companion or super app with multiple connected lanes:

- Qur'an reading and continuity
- hifz sessions and SRS review
- official Quran.com enrichment and bookmark sync
- grounded AI ayah explanation
- private journaling
- dua modules and personal dua management
- practice drills and fluency improvement
- milestones, reminders, settings, billing, and support

The product is still serious about memorization quality, but it is no longer only a memorization tool.

## 2. The Biggest Product Pivot

The early plan and many older docs assumed a narrower structure:

- landing page
- hifz engine
- Qur'an browser
- onboarding

That is no longer enough to describe the repo.

The current live shape is:

- dashboard-first after sign-in
- Qur'an hub and reader as one of the deepest surfaces
- hifz queue as one lane inside a broader product
- additional support lanes for dua, journal, fluency, practice, and milestones

This matters because older documents can still sound like Hifzer is "just a hifz system." That is outdated.

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

- there is no current `/today` page
- auth redirects should land on `/dashboard`

## 4. Product Surface Summary

### Dashboard

The dashboard is the post-auth home. It summarizes:

- current practice status
- KPIs and session trends
- review health
- Qur'an progress
- streaks
- quick actions into the rest of the app

### Qur'an

The Qur'an lane is much deeper than the original browser:

- hub with continue reading, completion, plan, surah progress, jump tools, and backfill
- reader in list and compact modes
- saved reader filter preferences
- translations and phonetics
- official tafsir selection
- Quran.com filter actions
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

The dua system is no longer a static page. It includes:

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

The repo does not use `src/_legacy`. Older docs that say that are stale. The preserved legacy UI is under `src/app/legacy`.

## 6. Domain Map

Main domain services under `src/hifzer`:

- `ai`
  App-side AI contracts and gateway config.
- `audio`
  Reciter mapping and audio URL resolution.
- `bookmarks`
  Smart bookmark logic and local sync behavior.
- `dashboard`
  Aggregated dashboard overview.
- `focus`
  Distraction-free and reading-mode behavior.
- `i18n`
  UI language and copy.
- `journal`
  Private journal persistence and local fallback.
- `profile`
  User profile creation and snapshot access.
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

### Quran.com / Quran Foundation

Current shipped behavior:

- linked Quran.com account in settings
- bookmark push/import sync
- official reader enrichment
- official tafsir selection in reader filters

Current limitation:

- broader user scopes like goals, activity days, collections, and notes are not yet fully integrated in the live app

### AI

Current AI explanation architecture:

- app route: `POST /api/quran/ai-explain`
- worker: `workers/ai-gateway`
- default provider: Groq
- grounding source: Quran MCP

This is important because older docs may still say Gemini is the live provider. That is now stale.

### Email

Reminder email flows use Resend.

### Billing

Upgrade and customer-management surfaces are wired around Paddle.

### Monitoring

Sentry and Vercel Analytics are used for observability/telemetry.

## 9. Known Historical Drift In Docs

The repo intentionally keeps historical audits and reports, but many are no longer current.

Common stale assumptions in older docs:

- `/today` still exists
- Hifzer is only a hifz system
- Gemini is the only AI provider
- the product is mostly landing + onboarding + session + browser
- legacy code lives under `src/_legacy`

When you see conflicts, trust current code first, then:

1. `AGENTS.md`
2. root `README.md`
3. this handoff
4. current runbooks

Historical audit files under `docs/audits/**` should be treated as archival snapshots, not as the current spec.

## 10. Recommended Reading For New Contributors

1. `../AGENTS.md`
2. `../README.md`
3. `HIFZER_PROJECT_HANDOFF.md`
4. `README.md` inside `workers/ai-gateway` if touching AI
5. specific runbooks only when working in those areas
