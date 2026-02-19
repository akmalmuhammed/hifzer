# Clerk Fresh Reset Runbook (Hifzer)

This runbook resets Clerk auth with new keys while keeping app URLs stable on `/login` and `/signup`.

## 1) Safety Snapshot

1. Backup current Vercel environment variables (Production/Preview/Development).
2. Confirm deploy branch/commit (`main`).
3. Keep `.claude/settings.local.json` ignored locally.

## 2) Fresh Clerk Instance (Phase 1: no custom domain)

1. Create a new Clerk production instance.
2. Keep Clerk default domain for now (do not enable custom domain yet).
3. Enable required auth methods:
   - email/password
   - username/email identification (to match app behavior)
4. In Clerk dashboard, set:
   - Sign-in URL: `https://www.hifzer.com/login`
   - Sign-up URL: `https://www.hifzer.com/signup`
   - Sign-out redirect: `https://www.hifzer.com/login`

## 3) Vercel Env Hard Reset

Delete all Clerk-related env vars in all environments, then add only:

- Required:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- Recommended:
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/today`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/today`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/today`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/today`

Keep unset during phase-1 isolation:

- `HIFZER_TEST_AUTH_BYPASS`
- `NEXT_PUBLIC_CLERK_FRONTEND_API_URL`
- `CLERK_FRONTEND_API_URL`
- `NEXT_PUBLIC_CLERK_DOMAIN`
- `CLERK_DOMAIN`
- `NEXT_PUBLIC_CLERK_PROXY_URL`
- `CLERK_PROXY_URL`

Then redeploy production.

## 4) Production Verification (must pass)

Browser checks (Incognito):

1. `/login` renders complete Clerk sign-in form.
2. `/signup` renders complete Clerk sign-up form.
3. Sign-in success lands on `/today`.

Network + console checks:

1. No Clerk/CSP errors in console.
2. `clerk.browser.js` loads successfully.
3. Clerk API calls (`/v1/client`, `/v1/environment`) return `200`.

Header check:

```bash
curl -sSI https://www.hifzer.com/login | grep -i '^content-security-policy:'
```

App behavior checks:

1. Signed-out `/dashboard` redirects to `/login`.
2. Signed-in `/dashboard`, `/today`, `/quran` are accessible.
3. Protected APIs return authenticated responses.

## 5) Optional Phase 2: Re-enable Custom Domain

Only after phase-1 is green:

1. Configure custom Clerk domain (e.g. `clerk.hifzer.com`).
2. Rotate to matching publishable/secret key pair.
3. Redeploy.
4. Repeat all verification from section 4.
5. If regression appears, roll back to phase-1 keys immediately.

## 6) Repo Notes (already aligned)

- Public auth URLs stay `/login` and `/signup`.
- Internal auth routes use catch-all:
  - `src/app/(auth)/login/[[...login]]/page.tsx`
  - `src/app/(auth)/signup/[[...signup]]/page.tsx`
- `/sign-in` remains a legacy redirect and must not be used as Clerk app-domain sign-in URL.
