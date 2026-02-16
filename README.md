# Hifzer

Front-heavy Next.js prototype for a Qur'an hifz system: marketing + Qur'an browser + the foundations for onboarding, sessions, and SRS-driven retention.

## Stack

- Next.js App Router + TypeScript
- Tailwind v4 (CSS variable tokens in `src/app/globals.css`)
- Framer Motion (reduced-motion aware)
- Custom SVG charts (no chart library)

## Routes (Current)

Public:

- `/` landing
- `/welcome`
- `/pricing`
- `/legal`
- `/legal/terms`
- `/legal/privacy`
- `/legal/refund-policy`
- `/legal/sources`
- `/changelog`
- `/login`
- `/signup`
- `/forgot-password`

App routes:

- `/today`
- `/session`
- `/quran`
- `/quran/surah/[id]`
- `/quran/juz/[id]`
- `/progress/*`
- `/settings/*`

## Auth (Clerk)

Clerk is scaffolded and enabled when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set.

- `middleware.ts` protects app + onboarding routes when Clerk is configured.
- App gating now also checks Prisma `UserProfile.onboardingCompletedAt` in `(app)` layout.
- Onboarding redirects are driven by DB-backed profile state, not middleware cookie checks.

## Billing (Paddle)

Pricing is currently wired for Paddle-style configuration checks (UI gating).

- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`

Required policy paths for checkout verification:

- `/legal/terms`
- `/legal/privacy`
- `/legal/refund-policy`

## Qur'an Data

Local seed files live in:

- `src/hifzer/quran/data/ayahs.full.json` (6,236 ayahs; global `id` 1..6236)
- `src/hifzer/quran/data/quran-data.js` (Tanzil metadata source)
- `src/hifzer/quran/data/surah-index.ts` (generated)

Generate surah index:

```bash
node scripts/generate-surah-index.mjs
```

## Audio (Cloudflare R2 Ready)

Configure the base URL (optional for now):

- `NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL=https://<your-domain-or-r2-public-base>`

Convention (placeholder until final layout is provided):

`{base}/{reciterId}/{ayahId}.mp3`

When not configured, audio players render a disabled "Not configured" state (no crashes).

First-time R2 setup guide:

- `docs/r2-first-time-setup.md`
- Generate expected object keys: `pnpm audio:manifest -- --reciters default`

## Database (Prisma + Neon)

Prisma is configured via `prisma.config.ts` (Prisma v7 style). Set `DATABASE_URL` before running Prisma commands.

```bash
pnpm db:generate
```

Recommended first-time setup:

```bash
pnpm db:migrate
```

Notes:

- This project uses a dedicated Postgres schema (`schema=hifzer`) in `DATABASE_URL` to avoid clashing with other apps in the same Neon database.
- Onboarding start-point and display preferences persist to `UserProfile`.
- Completed sessions are synced to Prisma via `/api/session/sync`.

## SEO + Crawlability

- `src/app/robots.ts`
- `src/app/sitemap.ts`

Sitemap includes public routes plus all Surah and Juz pages.

## Development

```bash
pnpm install
pnpm dev
```

Tests:

```bash
pnpm test
pnpm test:e2e
```

E2E auth behavior:

- Playwright runs with `HIFZER_TEST_AUTH_BYPASS=1` so public navigation tests can run without Clerk login UI.
- This bypass is only for test web-server runs and is not enabled by default in normal dev/prod.
