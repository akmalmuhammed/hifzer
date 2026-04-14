# Operational Troubleshooting

Use this runbook when the app is deployed but a core user flow is failing.

This document is intentionally practical. Start with the relevant symptom, run the smallest smoke test, and only then go deeper.

## 1. First Checks

Before feature-specific debugging:

1. Confirm the deploy is on the expected branch and commit.
2. Run `pnpm run build` locally if the issue looks code-related.
3. Check Vercel env vars for the target environment.
4. Check Sentry for matching server or client exceptions.
5. Check whether the issue is:
   - auth-only
   - database-only
   - Quran.com-only
   - AI-only
   - audio-only

## 2. Auth / Clerk

### Symptom

- `/login` or `/signup` does not render correctly
- protected routes do not redirect correctly
- sign-in succeeds but does not land on `/dashboard`

### First Checks

Open:

- `/login`
- `/signup`
- `/dashboard` while signed out

Expected:

- signed-out protected routes redirect to `/login`
- sign-in and sign-up finish at `/dashboard`

### Required Env

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard`

### Next Step

Use:

- `clerk-reset-runbook.md`

## 3. Dashboard

### Symptom

- dashboard shows `Dashboard unavailable`
- dashboard loads for some users but not others

### Smoke Test

```bash
curl -i https://your-app-domain.com/api/dashboard/overview
```

### Expected

- `401` when unauthenticated
- `200` with `{ ok: true, overview: ... }` when authenticated
- `503` only when DB is not configured

### Common Causes

- no auth session
- database unavailable
- profile compat or migration drift
- server-side exception inside dashboard aggregation

### Where To Look

- Vercel runtime logs
- Sentry for `/api/dashboard/overview`

## 4. Quran.com Linking

### Symptom

- `Link Quran.com account` loops or fails
- settings page shows `not configured`
- callback returns with `qf=oauth-failed`, `state-mismatch`, or `not-configured`

### Smoke Test

```bash
curl https://your-app-domain.com/api/quran-foundation/status
```

### What To Check In Response

- `userApiReady`
- `contentApiReady`
- `state`
- `detail`
- `scopes`

### Required Env For User Flow

- `QF_OAUTH_CLIENT_ID`
- `QF_OAUTH_CLIENT_SECRET`
- `QF_USER_TOKEN_ENCRYPTION_SECRET`
- `QF_OAUTH_REDIRECT_URI`

Fallback names still supported:

- `QF_CLIENT_ID`
- `QF_CLIENT_SECRET`
- `QF_TOKEN_ENCRYPTION_SECRET`

### Common Causes

- missing OAuth env vars
- token encryption secret missing
- callback URL mismatch in Quran.Foundation dashboard
- DB migrations not applied for `QuranFoundationAccount`

### High-Signal Routes

- `/settings/quran-foundation`
- `/api/quran-foundation/status`
- `/api/quran-foundation/connect`
- `/api/quran-foundation/callback`

## 5. Quran.com Content Enrichment

### Symptom

- official tafsir or translation content fails in the reader
- Quran.com reciter/audio path is unavailable
- content API is configured but reader enrichment is degraded

### Smoke Tests

```bash
curl "https://your-app-domain.com/api/quran/content-panel?ayahId=1"
curl "https://your-app-domain.com/api/quran/audio-source?ayahId=1&reciterId=alafasy"
```

### Required Env For Content

- `QF_CONTENT_CLIENT_ID`
- `QF_CONTENT_CLIENT_SECRET`

Fallback behavior:

- `QF_OAUTH_CLIENT_ID` and `QF_OAUTH_CLIENT_SECRET` are also accepted as content client fallbacks

### Common Causes

- content credentials missing
- Quran.Foundation content scope/availability issue
- bad resource IDs for translation or tafsir
- official reciter requested but unavailable for the verse/provider

### Good Verification Path

1. Check `/api/quran-foundation/status`
2. Check `/api/quran/content-panel?ayahId=1`
3. Check `/api/quran/audio-source?ayahId=1&reciterId=alafasy`
4. Test the reader UI after the APIs return healthy payloads

## 6. AI Explanation

### Symptom

- `Explain this ayah` shows unavailable
- app route returns `503`, `502`, or `504`
- Worker health fails

### App Smoke Test

```bash
curl -X POST https://your-app-domain.com/api/quran/ai-explain \
  -H 'content-type: application/json' \
  --data '{"ayahId":1}'
```

### Worker Health Check

`/health` is protected. Use the shared bearer:

```bash
curl https://your-worker.your-subdomain.workers.dev/health \
  -H "authorization: Bearer YOUR_SHARED_SECRET"
```

### Required App Env

- `HIFZER_AI_GATEWAY_URL`
- `HIFZER_AI_GATEWAY_TOKEN`

### Required Worker Env

- `AI_GATEWAY_SHARED_SECRET`
- `QURAN_MCP_URL`
- `GEMINI_API_KEY` for the default deployment path

Optional for Groq:

- `GROQ_API_KEY`
- `AI_PROVIDER=groq`

### Common Causes

- app token and worker secret mismatch
- Worker deployed without required secrets
- Worker pointed at unavailable Quran MCP endpoint
- Gemini or Groq key missing
- long-running upstream call causing timeout

### Where To Look

- `pnpm ai:worker:tail`
- Vercel logs for `/api/quran/ai-explain`
- Sentry for app route failures

## 7. Local Audio

### Symptom

- local reciter audio does not play
- official Quran.com reciters work but the default reciter does not

### Smoke Test

```bash
curl -I https://your-audio-domain.com/alafasy/000001.mp3
```

### Required Env

- `NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL`
- `NEXT_PUBLIC_HIFZER_DEFAULT_RECITER_ID`
- `NEXT_PUBLIC_HIFZER_AUDIO_AYAH_ID_WIDTH`

### Common Causes

- public base URL missing
- wrong key naming in R2
- bad CORS
- wrong reciter folder name

### Important Current Behavior

- local audio is used first when available
- official Quran.com reciters use the content API and do not depend on the local R2 bucket

## 8. Build / Deploy Failures

### Symptom

- Vercel build fails
- deploy succeeds but routes behave like env is missing

### First Checks

```bash
pnpm install
pnpm run build
```

Then compare:

- local `.env`
- Vercel Production env
- callback URLs and external dashboard config

### Common Causes

- env present locally but missing in Vercel
- stale database schema in deployed environment
- wrong Quran.com callback URL
- Worker deployed but app env still points at the old URL

## 9. Observability

Current observability stack:

- Sentry for exception capture
- Vercel Analytics for usage analytics
- Vercel Speed Insights for performance telemetry

Use:

- Sentry first for stack traces and tagged route failures
- Vercel runtime logs for request-level failures
- Cloudflare Worker tail for AI gateway issues

## 10. Related Docs

- `../README.md`
- `HIFZER_PROJECT_HANDOFF.md`
- `ai-gateway-cloudflare-setup.md`
- `clerk-reset-runbook.md`
- `r2-first-time-setup.md`
