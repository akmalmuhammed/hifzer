# Hifzer Hackathon Readiness Live Audit

Date: 2026-05-18
Target: https://www.hifzer.com
Hackathon: https://launch.provisioncapital.com/quran-hackathon

## Executive Verdict

Hifzer is visually credible and the core product story is strong: daily Quran continuity, hifz retention, source-grounded understanding, duas, and private reflection in one place.

The biggest risk is not product ambition. The biggest risk is judge verification.

If a judge cannot enter the app quickly, cannot see Quran Foundation User API proof, or sees public claims that are not clearly backed by live proof, Hifzer can look polished but still lose API and technical-execution points.

## Confirmed Hackathon Requirement

The hackathon requires:

- at least one Quran Foundation Content API or Quran MCP integration
- at least one Quran Foundation User API integration

Current code and live API checks show Content API readiness is real. User API implementation exists in the codebase, but live end-to-end User API proof could not be verified through a new-user flow because signup hits Clerk/Cloudflare human verification.

## Live New-User Signup Test

Attempted flow:

1. Opened https://generator.email/
2. Generated `lloalg@sedekah-mudah.com`
3. Opened https://www.hifzer.com/signup
4. Filled first name, last name, username, email, and password
5. Clicked Continue

Result:

- Signup did not reach email-code verification.
- Clerk displayed Cloudflare "Verify you are human".
- The Continue button remained disabled/loading after the human challenge appeared.
- No verification email reached generator.email within two minutes.
- Screenshot: `test-results/hackathon-readiness-20260518/signup-03-after-submit.png`

Impact:

This blocks autonomous new-user testing and can block judges unless they are willing to complete the challenge manually. For hackathon judging, provide demo credentials or a one-click seeded demo workspace.

## Confirmed Live Route Sweep

Public routes tested:

- `/`
- `/compare`
- `/quran-preview`
- `/legal`
- `/legal/terms`
- `/legal/privacy`
- `/legal/refund-policy`
- `/legal/sources`
- `/changelog`
- `/login`
- `/signup`

Protected routes tested:

- `/dashboard`
- `/quran`
- `/reader`
- `/hifz`
- `/dua`
- `/journal`
- `/support`

Result:

- Public routes returned 200.
- Protected routes redirected to login.
- `/login` and `/signup` rendered; they are not blank.
- Live auth copy says `Sign in to HIFZR`; this is a brand typo likely coming from Clerk application configuration.

Artifact:

- `test-results/hackathon-readiness-20260518/audit-results.json`

## API Verification

### Quran Foundation Content API

Live check:

`GET https://www.hifzer.com/api/quran/content-panel?ayahId=165`

Result:

- Status 200
- Provider: `quran_foundation`
- Verse key: `2:158`
- Returned official translation catalog and tafsir catalog.

Verdict:

Content API proof exists and is live.

### Quran Foundation Audio

Live checks:

- `GET /api/quran/audio-source?ayahId=1&reciterId=qf:7` returned available Quran.com audio.
- `GET /api/quran/audio-source?ayahId=165&reciterId=qf:7` returned `not_found` for `2:158`.

Verdict:

Audio integration works for some ayahs, but the demo should use a verified ayah/audio pair such as `1:1` or `112:1`. Do not rely on `2:158` in the final demo unless the not-found behavior is intended and explained.

### Quran Foundation User API

Live unauthenticated checks:

- `/api/quran-foundation/status` returned `available: true`, `state: disconnected`, `userApiReady: true`, `contentApiReady: true`.
- `/api/quran-foundation/overview` returned 401 without auth.
- `/api/quran-foundation/bookmarks/hydrate` returned 401 without auth.
- `/api/bookmarks` returned 401 without auth.
- `/api/bookmarks/sync` returned 401 without auth.

Code proof:

- Quran Foundation OAuth, token storage, encryption, refresh, connection status, and sync routes exist.
- Bookmark push/import/reconcile, collections sync, notes import/push, overview, status, connect, callback, and disconnect routes exist.
- Dashboard/settings UI includes a "Quran Foundation API proof" surface.

Verdict:

Implementation exists, and unauthenticated protection is correct. The unverified part is live connected-account behavior through a fresh judge-accessible account. This must be demonstrated with demo credentials or video.

### AI Endpoints

Live unauthenticated checks:

- `POST /api/quran/ai-assistant` returned 200 with a Groq answer.
- `POST /api/quran/ai-explain` returned 200 with a Groq answer.

Verdict:

The public AI demo works, but it is also an unauthenticated billable surface. Add rate limiting, a signed demo token, or require auth outside a small public demo quota.

## Validation Commands

Passed:

- `corepack pnpm lint`
- `corepack pnpm build`
- Targeted Vitest suites:
  - `src/hifzer/quran-foundation/oauth.test.ts`
  - `src/hifzer/quran-foundation/config.test.ts`
  - `src/hifzer/quran-foundation/content.test.ts`
  - `src/hifzer/quran-foundation/feedback.test.ts`
  - `src/hifzer/ai/server.test.ts`
  - `src/hifzer/ai/config.test.ts`
  - `src/hifzer/quran/search.server.test.ts`
  - `src/hifzer/quran/lookup.test.ts`
  - `src/hifzer/quran/translation.server.test.ts`
  - Result: 54 tests passed.
- `corepack pnpm exec prisma migrate status --config=./prisma.config.ts`
  - Result: database schema is up to date.
- Live mobile overflow audit:
  - 360px and 414px widths
  - 0px overflow on all sampled public/auth/protected redirect routes.

Not clean:

- `corepack pnpm test` timed out because the default test glob includes a live/manual audit test.
- Retrying Vitest with the manual file excluded also timed out.
- `corepack pnpm audit:clicks` failed with Playwright `Execution context was destroyed`, so the audit script itself needs hardening.

## Performance Findings

Live resource sweep on `/`:

- 30 scripts
- 8 font files, about 356 KB transferred
- Clerk JS loaded on landing
- Google Tag Manager loaded on landing
- `/icon.png` is transformed into a 154 KB nav/logo image request
- total measured image transfer included a 154 KB icon plus lightweight showcase images

Known real-user Speed Insights from earlier screenshots:

- TTFB P75: 3.08s
- LCP P75: 4.46s
- FCP P75: 4.46s

Likely causes:

- landing is a full client component
- global Clerk/analytics/PWA islands load on public pages
- oversized app icon is used as a tiny UI mark
- too many fonts are globally scoped

Top performance fixes:

1. Convert landing to mostly server components.
2. Keep auth-aware nav as a tiny client island or use static CTA copy.
3. Replace `/icon.png` in UI with an inline SVG/tiny optimized mark.
4. Scope extra fonts to pages/components that need them.
5. Lazy-load below-the-fold demo sections.

## Mobile UX Findings

Confirmed:

- No page-level horizontal overflow on sampled mobile routes.
- `/signup` and `/login` Clerk inputs/buttons are 30px tall, below 44px tap-target guidance.
- Password eye button is about `40x24`.
- `/quran-preview` CTAs are 42px high and sit at `x=0` on mobile.
- `/quran-preview` only previews the first 18 surahs.
- Landing guidance chips look interactive but are static spans.
- Selecting Urdu sets `html lang="ur"` and `dir="rtl"` while most page copy remains English.

Top mobile fixes:

1. Override Clerk element sizing to 44px+ controls.
2. Fix language selector semantics: if it controls Quran translation, do not switch full-page `lang`/`dir`.
3. Add mobile padding to `/quran-preview`.
4. Make static guidance chips either real buttons or visibly non-clickable examples.

## Content and Messaging Audit

Strong:

- "Daily Quran practice system" is clearer than generic "Islamic companion".
- The four pillars are easy to understand: read, memorize, understand, reflect.
- The retention angle is stronger than a generic Quran reader pitch.
- `/compare` has strong positioning: built for retention, not streaks.
- `/legal/sources` gives credibility.

Weak:

- The landing page still says `Quran.com API integration`; the hackathon source of truth says Quran Foundation APIs. Use "Quran Foundation / Quran.com APIs" where eligibility matters.
- Public copy does not quickly prove which parts are live API integrations versus local bundles.
- `/quran-preview` says "Browse surahs before signing in" but only shows the first 18 surahs.
- FAQ answers exist behind `<details>`, but collapsed questions can look like static/incomplete content in quick judge scans.
- The strongest judge-facing pages, `/compare` and `/legal/sources`, are not promoted strongly enough.

Recommended copy shift:

Current broad story:

> Keep your Quran routine steady.

Sharper hackathon story:

> Hifzer helps you return to the Quran tomorrow: resume the exact ayah, read with official Quran Foundation enrichment, save what matters, understand with grounded sources, and keep hifz review from slipping.

## Sentry / Observability

Sentry CLI is authenticated for org `hifzer`, project `javascript-nextjs`.

Recent unresolved issues include:

- `404 page_not_found:/about`, last seen 2026-05-14
- Several older Clerk middleware detection errors, last seen 2026-05-01
- older hydration and server-component render errors

Verdict:

No fresh high-volume crash was confirmed in this audit, but unresolved Sentry noise should be triaged or marked resolved after confirming fixes.

## Tooling and Deployment State

- Git local branch was synced with `origin/main` at commit `8dc93a8`.
- Vercel production deployment for `www.hifzer.com` is Ready and was built from commit `8dc93a8`.
- Vercel CLI authenticated as `proaisignal-9658`.
- Wrangler is not currently authenticated; `wrangler whoami --json` failed with "Not logged in."

## Top Blocking Weaknesses

1. Judge access is blocked by Clerk/Cloudflare human verification unless demo credentials or a demo workspace are provided.
2. Quran Foundation User API proof is implemented but not fresh-account verified in this audit.
3. Public AI endpoints are unauthenticated and billable.
4. Landing performance remains risky for FCP/LCP due to client-heavy landing, Clerk, GTM, fonts, and oversized icon.
5. Language selector behaves like full UI localization but only translation/data changes are meaningful.

## Highest-Leverage Fixes Before Submission

1. Add a public `/demo` or judge demo mode with seeded data and no signup friction.
2. Add a visible "Quran Foundation API proof" link from landing/footer to settings/demo, showing Content API, User API scopes, sync status, and last sync.
3. Provide working demo credentials with Quran.com already connected and fresh scopes.
4. Rate-limit or gate `/api/quran/ai-*`.
5. Replace `Quran.com API integration` marketing copy with "Quran Foundation-powered reading, audio, tafsir, and synced memory".
6. Fix Clerk brand typo from `HIFZR` to `Hifzer`.
7. Change language dropdown label to "Quran translation" unless full UI localization is finished.
8. Expand `/quran-preview` to all 114 surahs or rename it "Sample preview".
9. Replace the 154 KB nav icon with an inline SVG.
10. Create a clean non-manual CI test command that excludes live/manual audits.

## Recommended Demo Path

1. Start at `/dashboard` with a preconnected Quran.com account.
2. Show "Quran Foundation API proof" status quickly.
3. Open `/quran/read?view=compact`.
4. Select official translation/tafsir/audio.
5. Save a bookmark and show sync state.
6. Ask AI to explain the ayah with source labels.
7. Add a private journal reflection or synced note.
8. Return to dashboard to show continuity: last ayah, hifz status, streak/goal/reading memory.

## Provisional Score

If judged only by publicly accessible live flow:

- Impact on Quran Engagement: 24/30
- Product Quality and UX: 15/20
- Technical Execution: 14/20
- Innovation and Creativity: 12/15
- Effective Use of APIs: 9/15
- Total: 74/100

If the final submission video and demo credentials clearly prove connected Quran Foundation User API sync:

- realistic ceiling: 82-86/100

Current top-3 blocker:

The project must stop making judges infer the API proof. They need to see it in the demo within the first minute.
