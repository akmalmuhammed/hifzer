# Hifzer Mobile Performance + PWA Audit

Date: 2026-02-20

## Scope
- Mobile-first performance review of app shell and global UI.
- Installability and add-to-homescreen readiness.
- Runtime/network costs visible from code paths.

## Constraints During Audit
- Local Node package tooling was unavailable in this shell (`node`, `npm`, `pnpm` missing in PATH), so this pass is code-level and architecture-level.
- Lighthouse numbers must be captured from your machine/CI after this patch.

## Changes Implemented

### 1) Add-to-homescreen / PWA baseline
- Added web app manifest at `src/app/manifest.ts`.
- Added service worker at `public/sw.js` with:
  - app shell caching
  - offline navigation fallback
  - static asset stale-while-revalidate strategy
- Added service worker registration at `src/components/pwa/service-worker-registration.tsx`.
- Wired registration into root layout in `src/app/layout.tsx`.

### 2) Install CTA in product UI
- Added `src/components/pwa/install-app-button.tsx`.
- Integrated it into the top-right streak control cluster on mobile:
  - `src/components/app/streak-corner-badge.tsx`
- Supports:
  - Android/Chromium `beforeinstallprompt`
  - iOS Safari guidance via toast (Share -> Add to Home Screen)

### 3) Mobile performance optimizations
- Reduced repeat network activity for streak badge:
  - removed refetch-on-every-route-change
  - added refresh-on-visibility and 5-minute interval
  - file: `src/components/app/streak-corner-badge.tsx`
- Deferred analytics loading:
  - removed inline GA boot script in `<head>`
  - added lazy-loaded GA script component `src/components/telemetry/google-analytics.tsx`
  - wired in `src/app/layout.tsx`
- Reduced expensive mobile visual effects in `src/app/globals.css`:
  - simplified heavy canvas gradients on small screens
  - disabled noise overlay on <=768px
  - disabled marquee animation and heavy blur glass on <=640px

### 4) Bundle optimization
- Enabled package import optimization for lucide icons in `next.config.ts`:
  - `experimental.optimizePackageImports: ["lucide-react"]`

## Expected Impact
- Better installability and stronger “app-like” behavior on mobile.
- Lower CPU/GPU work on smaller devices from reduced background effects.
- Fewer unnecessary API calls while navigating.
- Lower JS loaded/executed earlier due deferred analytics and optimized icon imports.

## Validation Checklist (Run Before Production)

1. Build and run:
   - `pnpm install`
   - `pnpm build`
   - `pnpm start`
2. Lighthouse mobile runs:
   - Home (`/`)
   - Session (`/session`)
   - Today (`/today`)
3. Verify installability:
   - Chrome DevTools -> Application -> Manifest: no critical errors
   - Service worker active for origin
   - Install prompt appears on supported Android browsers
   - iOS Safari shows manual install guidance
4. Confirm no regression:
   - Dark/light toggle still works in top-right
   - Streak badge still updates (on visibility return and periodic refresh)
   - Analytics events still fire (if `NEXT_PUBLIC_GA_MEASUREMENT_ID` is configured)

## Next High-Value Steps
- Add CI Lighthouse budgets (Performance, TBT, LCP) and fail PRs on regressions.
- Add route-level Web Vitals telemetry (LCP/INP/CLS) to monitor real user mobile performance.
- Tune fonts for mobile (optional): reduce non-critical weights if audits show transfer overhead.
