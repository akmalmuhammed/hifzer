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

Legacy namespace (preserved):

- `/legacy/app`
- `/legacy/app/goals`
- `/legacy/app/goals/[okrId]`
- `/legacy/app/projects`
- `/legacy/app/projects/[projectId]`
- `/legacy/app/insights`
- `/legacy/app/team`
- `/legacy/app/settings`
- `/legacy/sign-in`

Compatibility redirects:

- `/app` -> `/legacy/app`
- `/app/*` -> `/legacy/app/*`
- `/sign-in` -> `/legacy/sign-in`

## Auth (Clerk)

Clerk is scaffolded and enabled when both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set.

Recommended redirect contract:

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/today`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/today`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/today`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/today`

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
- `NEXT_PUBLIC_HIFZER_DEFAULT_RECITER_ID=alafasy` (optional, defaults to `alafasy`)
- `NEXT_PUBLIC_HIFZER_AUDIO_AYAH_ID_WIDTH=6` (optional, defaults to `6`)

Current convention:

`{base}/{publicReciterId}/{zero-padded-ayahId}.mp3`

Example:

`https://.../alafasy/000001.mp3`

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
pnpm test:e2e:routing
pnpm audit:clicks
```

E2E auth behavior:

- Playwright global setup uses `@clerk/testing/playwright` (`clerkSetup`) for deterministic bot-protection bypass.
- Signed-in routing specs require `E2E_CLERK_TEST_EMAIL` plus Clerk keys.
- In CI, Clerk testing env vars are required.
- `pnpm audit:clicks` writes JSON + Markdown artifacts to `test-results/click-audit`.
