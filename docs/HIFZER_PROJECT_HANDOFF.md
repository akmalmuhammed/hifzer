# Hifzer Project Handoff

Last updated: February 16, 2026  
Audience: New engineers, designers, and product contributors

## 1. Project Summary

Hifzer is a Next.js web app for Quran hifz practice, built as a front-heavy product with:

- strong UX and responsive app shell,
- seeded Quran dataset (6,236 ayahs),
- grade-driven SRS foundation (`Again/Hard/Good/Easy`),
- Clerk auth,
- Prisma + Neon persistence,
- legal/compliance-ready public pages for Paddle verification,
- R2-ready audio architecture.

The repo started as a new prototype workspace and was pivoted from a generic dashboard concept into a hifz product with real domain structure and data contracts.

## 2. Repo + Workspace Context

- Primary repo path: `D:\hifzer`
- GitHub: `https://github.com/akmalmuhammed/hifzer`
- Legacy reference vault (not coupled): `D:\codex`
- Current branch: `main`

Important: `src/_legacy` contains older prototype assets/routes kept for reference. The active product is under `src/app`, `src/hifzer`, and `src/components`.

## 3. Timeline and Major Milestones

## 3.1 Initial foundation

- New workspace bootstrapped with Next.js App Router + TypeScript + Tailwind.
- Brand and IA pivoted to Hifzer.
- Public landing + app shell + multi-route structure created.

## 3.2 Product pivot to Hifz domain

- Quran data imported as local seed:
  - `src/hifzer/quran/data/ayahs.full.json`
  - `src/hifzer/quran/data/surah-index.ts`
  - `src/hifzer/quran/lookup.server.ts`
- Route IA aligned to hifz flow (`/onboarding/*`, `/today`, `/session`, `/quran/*`, `/progress/*`, `/settings/*`).

## 3.3 Auth + DB integration

- Clerk gating added.
- Prisma schema added with SRS-critical models:
  - `UserProfile`
  - `Session`
  - `AyahAttempt`
  - `AyahReview`
  - `WeakTransition`
- API routes added for profile sync and session sync.

## 3.4 Pricing/legal/compliance

- Paddle-oriented pricing page implemented.
- Legal pages implemented:
  - `/legal/terms`
  - `/legal/privacy`
  - `/legal/refund-policy`
  - `/legal/sources`
  - `/legal` hub
- Footer/nav/sitemap updated for discoverability and verification readiness.

## 3.5 Reliability fixes after deployment testing

Applied in these commits:

1. `e22d64e`  
   fix: generate Prisma client during build  
   Why: Vercel + pnpm 10 may skip dependency lifecycle scripts; explicit `prisma generate` in `build` prevents missing Prisma types at compile time.

2. `d59dd2b`  
   fix: honor Prisma schema for Neon adapter runtime  
   Why: migrations ran in schema `hifzer`, but runtime adapter was querying default schema. Added runtime schema resolution to prevent "signed in but no profile" failures.

3. `d6b727e`  
   fix: rely on DB onboarding state in middleware flow  
   Why: cookie-based onboarding redirect in middleware could conflict with server profile state and cause route-flow confusion. Middleware now protects routes only; onboarding state authority is DB/profile logic.

## 3.6 Post-audit hardening (in progress branch state)

- Session sync endpoint now uses one transaction for session + attempts + review upserts.
- Duplicate session race hardened with DB uniqueness on `(userId, startedAt)`.
- Added migration enforcing the uniqueness (`Session_userId_startedAt_key`) and deduping legacy collisions.
- Server cursor progression now updates from synced NEW attempts.
- Local date generation is now true local calendar date (not UTC ISO slice).
- Local attempt storage is capped to avoid unbounded localStorage growth.
- Onboarding cookie sync dead code removed from client providers.
- Profile mutations now use single upsert calls (removes extra DB round trips).

## 4. Product and Architecture Decisions (with rationale)

## 4.1 Core product identity

- Name: Hifzer
- Positioning: calm, consistent hifz system
- Tone: no game metaphors

Reason: keeps religious-learning context respectful and focused on consistency.

## 4.2 Data identity strategy

- Internal ayah identity: global `ayahId` (1..6236)
- `(surah, ayah)` used for display and user input only

Reason: simplifies cross-feature joins and avoids composite-key complexity in SRS/session/transitions.

## 4.3 SRS signal strategy

- Removed confidence-slider-as-core idea
- Per-ayah grading is the durable signal: `AGAIN|HARD|GOOD|EASY`
- `AyahReview` stores station + interval + EF + next review

Reason: preserves data continuity for future AI scoring and real scheduling logic.

## 4.4 Front-heavy hybrid persistence

- Local-first session UX in `src/hifzer/local/store.ts`
- Server sync endpoint persists completed session artifacts

Reason: fast interactions now, backend continuity later.

## 4.5 Billing decision

- Current direction: Paddle (not Stripe)
- Free + Paid tiers + donation UI in pricing

Reason: product requirement changed; legal pages aligned for Paddle verification.

## 4.6 Audio decision

- Cloudflare R2 target
- URL convention currently: `{base}/{publicReciterId}/{zero-padded-ayahId}.mp3`
- graceful "not configured" UI if base URL missing

Reason: unblock UI and session flow now while storage details mature.

## 5. Current Code Map

## 5.1 Route groups

- Public routes: `src/app/(public)`
- Auth routes: `src/app/(auth)`
- Onboarding routes: `src/app/(onboarding)`
- App routes: `src/app/(app)`
- API routes: `src/app/api`

## 5.2 Domain modules

- Quran domain: `src/hifzer/quran/*`
- SRS domain: `src/hifzer/srs/*`
- Local session store: `src/hifzer/local/store.ts`
- Server profile model layer: `src/hifzer/profile/server.ts`
- Audio URL resolver: `src/hifzer/audio/config.ts`

## 5.3 Key UI layer

- App shell/layout/navigation: `src/components/app/*`
- Landing/marketing: `src/components/landing/*`
- Audio player: `src/components/audio/ayah-audio-player.tsx`
- Theme/provider stack: `src/components/providers/*`
- UI primitives: `src/components/ui/*`

## 6. Implemented User Flows (today)

## 6.1 Auth and profile bootstrap

1. User signs in with Clerk.
2. Protected route hit triggers app layout auth check.
3. `getProfileSnapshot()` calls `getOrCreateUserProfile()` (upsert by `clerkUserId`).
4. Profile state hydrates into client-side local store.

Key files:

- `src/app/(app)/layout.tsx`
- `src/hifzer/profile/server.ts`
- `src/components/providers/profile-hydrator.tsx`

## 6.2 Onboarding start-point flow

1. User selects surah + ayah in `/onboarding/start-point`.
2. Data stored locally and posted to `/api/profile/start-point`.
3. On completion, `/api/profile/onboarding-complete` sets server onboarding timestamp.
4. App routes redirect onboarding-incomplete users to onboarding.

Key files:

- `src/app/(onboarding)/onboarding/start-point/page.tsx`
- `src/app/api/profile/start-point/route.ts`
- `src/app/api/profile/onboarding-complete/route.ts`

## 6.3 Session flow

1. Queue built from due reviews + cursor + mode logic.
2. Step sequence includes WARMUP/REVIEW/NEW and LINK steps.
3. User grades each step with `Again/Hard/Good/Easy`.
4. Local SRS state updates instantly.
5. Completed session sync posts to `/api/session/sync`.
6. Server persists session + attempts + review updates.

Key files:

- `src/app/(app)/session/session-client.tsx`
- `src/hifzer/srs/queue.ts`
- `src/hifzer/srs/update.ts`
- `src/app/api/session/sync/route.ts`

## 6.4 Quran browsing

- Surah and Juz views are served from local seed data only.
- Every ayah row has audio player shell; playback works when base URL is configured.

Key files:

- `src/app/(app)/quran/page.tsx`
- `src/app/(app)/quran/surah/[id]/page.tsx`
- `src/app/(app)/quran/juz/[id]/page.tsx`
- `src/hifzer/quran/lookup.server.ts`

## 7. Database and Persistence Model

Schema file: `prisma/schema.prisma`

Core entities:

- `UserProfile`: auth identity, onboarding state, preferences, cursor, mode
- `Session`: planned ranges and session status
- `AyahAttempt`: atomic graded attempts by stage
- `AyahReview`: durable per-ayah SRS state
- `WeakTransition`: edge-level linking weakness tracker

Current status:

- Migration exists and deploys cleanly.
- Runtime now correctly targets schema via:
  - `HIFZER_DB_SCHEMA` or
  - `schema` query parameter in `DATABASE_URL`.

## 8. Environment Variables

Required for full production behavior:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`

Recommended:

- `HIFZER_DB_SCHEMA=hifzer` (explicit schema safety)

Feature flags/config:

- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- `NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL`
- `HIFZER_TEST_AUTH_BYPASS=1` (test-only; never set in production)

Clerk reset guidance:

- Keep production auth URLs on `/login` and `/signup`.
- Internally use catch-all Clerk routes:
  - `src/app/(auth)/login/[[...login]]/page.tsx`
  - `src/app/(auth)/signup/[[...signup]]/page.tsx`
- Keep `/sign-in` reserved for the existing legacy redirect.
- For baseline key rotation, unset optional Clerk domain/proxy/FAPI env vars.

## 9. Testing and Quality Gates

Unit tests:

- Quran lookup mapping
- SRS queue/mode logic
- SRS grade update behavior
- Derived analytics helpers

E2E tests:

- landing + pricing navigation
- legal pages and required policy links
- Quran Surah/Juz rendering
- session progression and local cursor advance

Commands:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

All above have passed after latest fixes.

## 10. Deployment Notes

## 10.1 Vercel build compatibility

Current build script runs Prisma generation explicitly:

```json
"build": "prisma generate --config=./prisma.config.ts && next build"
```

This is required due to pnpm install script restrictions in some CI environments.

## 10.2 Neon schema consistency

Use the same schema for:

- migration deploy,
- runtime Prisma adapter,
- direct SQL/manual inspection.

If profile/session tables look missing while migrations succeeded, schema mismatch is the first thing to check.

## 11. Legal/Compliance Readiness (Paddle)

Implemented pages:

- `/legal/terms`
- `/legal/privacy`
- `/legal/refund-policy`

Pricing page links all required policies and includes two-tier + donation UX.

## 12. Audio (R2) Operational Notes

Docs: `docs/r2-first-time-setup.md`

Manifest generator:

```bash
pnpm audio:manifest -- --reciters default --out tmp/audio-manifest.csv
```

Current assumed key pattern:

- `alafasy/000001.mp3` ... `alafasy/006236.mp3`

## 13. Known Gaps and Next Priorities

1. WeakTransition writes are not yet persisted from LINK grading path (UI notes this as next step).
2. Paddle checkout/webhooks and entitlement enforcement are scaffold-level, not full production billing logic.
3. Some IA routes are placeholders and need real product logic (fluency track, advanced insights, billing manage flows).
4. Local-first state is still primary in parts of session UX; server reconciliation strategy should be hardened for multi-device continuity.
5. Session sync currently performs per-ayah review upserts sequentially; batching or a tighter write strategy may be needed for very large sessions.

## 14. Operational Runbook for New Engineers

1. Clone repo and install:
   - `pnpm install`
2. Set env vars in `.env.local`.
3. Run migrations:
   - `pnpm db:deploy`
4. Start app:
   - `pnpm dev`
5. Verify baseline:
   - sign in with Clerk,
   - complete onboarding,
   - run a session and confirm DB writes.
6. Run gates before any push:
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`
   - `pnpm test:e2e`

## 15. Decision Log (Short Form)

1. Keep legacy prototype code in repo under `_legacy` rather than deleting, to preserve reference assets and reduce rework risk.
2. Use global ayah IDs internally to unify SRS/session/transition logic.
3. Store per-ayah grade attempts from day one to avoid migration pain when AI scoring arrives.
4. Keep local-first UX with server sync to maintain responsiveness during backend evolution.
5. Move billing direction to Paddle and align legal policy infrastructure early for verification.
6. Make DB profile state the source of truth for onboarding and route gating.

---

If you are onboarding today, start by reading:

1. `README.md`
2. `docs/HIFZER_PROJECT_HANDOFF.md` (this file)
3. `prisma/schema.prisma`
4. `src/hifzer/profile/server.ts`
5. `src/app/api/session/sync/route.ts`
6. `src/app/(app)/session/session-client.tsx`
