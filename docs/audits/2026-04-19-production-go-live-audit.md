# Hifzer Production Go-Live Audit

Date: 2026-04-19
Environment audited: `https://www.hifzer.com`
Auditor: Codex
Original recommendation: `NO-GO` until P1 issues are fixed
Remediation status: P1/P2 findings fixed and verified locally on 2026-04-19; deploy required before live production reflects the fixes.

## Remediation Verification

After remediation, the local production build and runtime checks passed:

- `npx eslint` passed on the changed production-readiness files.
- `npx tsc --noEmit` passed without depending on generated `.next` type artifacts.
- `npm run build` passed.
- Build output now marks `/`, `/compare`, `/legal`, `/legal/*`, `/quran-preview`, and `/changelog` as static pages.
- Local `next start` returned `Cache-Control: s-maxage=31536000` for the public marketing/SEO pages checked.
- Local CSP headers now allow GA collection endpoints used by the browser.
- `/unsubscribe` now emits `robots: noindex, nofollow`.

## Executive Summary

The production site is online, secure at the header level, and the application build succeeds. Core public routing works, protected routes redirect correctly, the sitemap is present, and auth/payment utility pages are mostly configured correctly.

The release is not enterprise-ready yet because three production issues remain at P1:

1. Google Analytics requests are being blocked by the live Content Security Policy, causing production console errors and dropped analytics events.
2. Public marketing and SEO pages are dynamically rendered with `Cache-Control: private, no-cache, no-store`, so they are not edge-cacheable.
3. RTL language support is incomplete because the document direction is never set, despite Urdu and Persian being available UI languages.

There are also metadata and indexing issues on multiple public pages that should be fixed before a serious production push.

## Scope

This audit covered:

- Live production website behavior on `https://www.hifzer.com`
- Public page metadata, canonicals, robots, and sitemap behavior
- HTTP headers and auth redirects
- Production browser runtime errors on public pages
- Code-level production readiness in routing, layout, telemetry, metadata, and typecheck/build gates

This audit did not treat uncommitted local feature work as production unless the same issue was confirmed on the live website or in the committed runtime path.

## Findings

### P1. Production analytics are blocked by CSP and emit live console errors

Evidence:

- Live browser audit on:
  - `/legal`
  - `/legal/privacy`
  - `/legal/refund-policy`
- Production console emitted CSP violations for requests to `https://www.google.com/g/collect`
- Those requests were blocked

Code references:

- [google-analytics.tsx](D:\hifzer\src\components\telemetry\google-analytics.tsx):15
- [google-analytics.tsx](D:\hifzer\src\components\telemetry\google-analytics.tsx):23
- [next.config.ts](D:\hifzer\next.config.ts):176
- [next.config.ts](D:\hifzer\next.config.ts):261

Why this matters:

- Production analytics are incomplete or lost
- Public pages generate avoidable console noise in production
- This is a direct mismatch between telemetry behavior and deployed security policy

Required fix:

- Align CSP `connect-src` with the actual GA endpoint behavior, or disable GA until CSP is corrected
- Re-run a browser audit and confirm zero CSP console errors on public pages

### P1. Public marketing pages are dynamically rendered and not cacheable

Evidence:

- Live `curl -I` on `/`, `/compare`, and `/legal` returned:
  - `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`
- Production build output marked public routes as dynamic server-rendered pages

Code references:

- [layout.tsx](D:\hifzer\src\app\(public)\layout.tsx):12
- [layout.tsx](D:\hifzer\src\app\(public)\layout.tsx):14
- [layout.tsx](D:\hifzer\src\app\(public)\layout.tsx):15
- [layout.tsx](D:\hifzer\src\app\(public)\layout.tsx):16
- [layout.tsx](D:\hifzer\src\app\(public)\layout.tsx):24

Why this matters:

- The homepage and public SEO pages are paying full dynamic rendering cost
- CDN/edge caching is effectively disabled on the pages that should scale the best
- This is a real production performance and cost issue, not a theoretical optimization

Required fix:

- Remove server-side `auth()` and cookie-dependent rendering from the public layout where possible
- Move signed-in CTA switching, theme, and language hydration to a client boundary or isolate them from the static shell
- Re-check response headers and confirm public pages become cacheable

### P1. RTL language support is incomplete because document direction is never set

Evidence:

- The app exposes Urdu and Persian as UI languages
- The server layout sets `lang`, but not `dir`
- The client provider updates `document.documentElement.lang`, but never updates `document.documentElement.dir`
- Production DOM inspection found no `dir` attribute on `<html>`

Code references:

- [ui-language.ts](D:\hifzer\src\hifzer\i18n\ui-language.ts):16
- [ui-language.ts](D:\hifzer\src\hifzer\i18n\ui-language.ts):42
- [layout.tsx](D:\hifzer\src\app\layout.tsx):88
- [ui-language-provider.tsx](D:\hifzer\src\components\providers\ui-language-provider.tsx):69
- [ui-language-provider.tsx](D:\hifzer\src\components\providers\ui-language-provider.tsx):74

Why this matters:

- RTL users can get incorrect reading order, alignment, spacing, and layout behavior
- This undermines multilingual production quality on a Qur'an product

Required fix:

- Set `dir="rtl"` or `dir="ltr"` on the server-rendered `<html>`
- Update the client provider to keep `dir` in sync with the chosen UI language
- Verify Urdu and Persian flows on live pages after the change

### P2. Multiple indexable public pages have generic or missing metadata and missing canonicals

Evidence from live production:

- `/quran-preview`: title only, no canonical, inherited generic description
- `/legal`: title only, no canonical, inherited generic description
- `/legal/terms`: title only, no canonical, inherited generic description
- `/legal/privacy`: title only, no canonical, inherited generic description
- `/legal/refund-policy`: title only, no canonical, inherited generic description
- `/legal/sources`: title only, no canonical, inherited generic description
- `/changelog`: generic title `Hifzer`, no canonical, inherited generic description
- `/compare`: canonical exists, but description is still inherited from root instead of page-specific copy

Code references:

- [layout.tsx](D:\hifzer\src\app\layout.tsx):27
- [layout.tsx](D:\hifzer\src\app\layout.tsx):51
- [layout.tsx](D:\hifzer\src\app\layout.tsx):58
- [quran-preview/page.tsx](D:\hifzer\src\app\(public)\quran-preview\page.tsx):8
- [legal/page.tsx](D:\hifzer\src\app\(public)\legal\page.tsx):5
- [legal\privacy/page.tsx](D:\hifzer\src\app\(public)\legal\privacy\page.tsx):5
- [legal\refund-policy/page.tsx](D:\hifzer\src\app\(public)\legal\refund-policy\page.tsx):5
- [legal\sources/page.tsx](D:\hifzer\src\app\(public)\legal\sources\page.tsx):16
- [compare/page.tsx](D:\hifzer\src\app\(public)\compare\page.tsx):5
- [changelog/page.tsx](D:\hifzer\src\app\(public)\changelog\page.tsx)

Why this matters:

- Search engines and social previews receive weak or misleading metadata
- Indexable pages lack proper canonical hygiene
- The public content layer looks unfinished from an enterprise SEO standpoint

Required fix:

- Add page-specific `description` and `alternates.canonical` on every indexable public page
- Add explicit metadata to `changelog`
- Re-crawl the live site and confirm metadata is page-specific and canonical tags are present

### P2. `/unsubscribe` is indexable in production

Evidence:

- Live `/unsubscribe` returned `robots: index, follow`
- The page is a utility flow, not a discovery page

Code references:

- [unsubscribe/page.tsx](D:\hifzer\src\app\(public)\unsubscribe\page.tsx):6
- [unsubscribe/page.tsx](D:\hifzer\src\app\(public)\unsubscribe\page.tsx):7

Why this matters:

- Utility/tokenized pages should not be indexed
- It creates poor SEO hygiene and unnecessary crawl surface

Required fix:

- Add `robots: { index: false, follow: false }`
- Optionally add an explicit canonical strategy or leave it non-indexable only

### P2. Standalone type-checking is unreliable on a clean checkout

Evidence:

- `npx tsc --noEmit` failed with:
  - `File 'D:/hifzer/.next/types/validator.ts' not found`
- `npm run build` succeeded

Code references:

- [tsconfig.json](D:\hifzer\tsconfig.json):31
- [tsconfig.json](D:\hifzer\tsconfig.json):35
- [tsconfig.json](D:\hifzer\tsconfig.json):37
- [tsconfig.json](D:\hifzer\tsconfig.json):43

Why this matters:

- CI and local verification are inconsistent
- A standalone type gate should not depend on pre-generated `.next` artifacts

Required fix:

- Remove or guard `.next` include patterns for standalone `tsc`
- Or standardize on `next build` as the enforced type gate and stop advertising `tsc --noEmit` as a separate signal

### P3. CSP is stronger than default, but still relies on `unsafe-inline`

Evidence:

- `script-src` includes `'unsafe-inline'`
- `style-src` includes `'unsafe-inline'`

Code references:

- [next.config.ts](D:\hifzer\next.config.ts):133
- [next.config.ts](D:\hifzer\next.config.ts):147

Why this matters:

- This is not a blocker if required by the current stack, but it is below enterprise-hardening expectations
- It should be treated as future hardening work after correctness issues are fixed

Required fix:

- Reduce inline allowances where feasible
- Introduce nonces or stricter script/style handling if the underlying libraries permit it

## Checks That Passed

- `npm run build` passed successfully
- Live public routes `/`, `/compare`, `/quran-preview`, `/legal`, `/legal/terms`, `/legal/privacy`, `/legal/refund-policy` returned `200`
- Protected routes like `/quran` and `/support` redirected anonymous users to `/login?...`
- `robots.txt` exists and is valid
- `sitemap.xml` exists and did not expose protected app routes
- Security headers are present in production:
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
- Auth and checkout utility pages are correctly `noindex`:
  - `/login`
  - `/signup`
  - `/forgot-password`
  - `/pay`
- Repo-wide ESLint produced warnings only, no current lint errors

## Commands Run

- `git -C D:\\hifzer status --short`
- `curl.exe -I https://www.hifzer.com/...`
- `curl.exe https://www.hifzer.com/robots.txt`
- `curl.exe https://www.hifzer.com/sitemap.xml`
- `node` scripts using `https` to extract live title/description/canonical/robots tags
- `node` scripts using Playwright to inspect live public pages for console/page errors
- `npx tsc --noEmit`
- `npm run build`
- `npx eslint . --ext .ts,.tsx,.js,.mjs`

## Release Recommendation

Current recommendation: `NO-GO`

Required before go-live signoff:

1. Fix GA/CSP mismatch and verify zero production console CSP errors
2. Remove dynamic no-store behavior from public marketing pages
3. Implement proper RTL `dir` propagation
4. Fix metadata/canonical coverage on indexable public pages
5. Mark `/unsubscribe` as `noindex`

After those are fixed, rerun:

- live metadata crawl
- live browser console audit
- cache header check on `/`, `/compare`, `/legal`
- build + lint + routing smoke
