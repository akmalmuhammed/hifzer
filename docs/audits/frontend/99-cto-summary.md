# Frontend CTO Summary

Generated: 2026-02-25T11:03:32.988Z

## Executive Snapshot

- Frontend files reviewed in scope: 225
- LOC reviewed: 24556
- Findings: 49 (modern: 44, legacy: 5)
- Batch reports delivered: B0 through B7

## Top 10 Blockers

1. F-B0-001 (P1) — Global document direction is not set for RTL interface languages. [src/app/layout.tsx:110]
2. F-B0-002 (P1) — Client language switch updates `lang` but never updates `dir`. [src/components/providers/ui-language-provider.tsx:27]
3. F-B0-006 (P1) — Routing middleware uses a deprecated Next.js file convention. [src/middleware.ts:68]
4. F-B0-007 (P1) — `Date.now()` is called during render, failing purity lint. [src/app/(app)/today/page.tsx:72]
5. F-B0-009 (P1) — Automated frontend audits are blocked by missing Playwright system dependency. [scripts/click-routing-audit.mjs:83]
6. F-B1-001 (P1) — Public routing tests still target `/pricing`, which is no longer a current public route. [e2e/routing.public.spec.ts:4]
7. F-B1-002 (P1) — Signed-out `/quran` auth expectation diverges from current runtime behavior. [e2e/routing.public.spec.ts:69]
8. F-B2-003 (P1) — Onboarding start-point save path does not validate API response success. [src/app/(onboarding)/onboarding/start-point/page.tsx:75]
9. F-B4-001 (P1) — Today core workflow header/copy is hardcoded English. [src/app/(app)/today/today-client.tsx:303]
10. F-B4-002 (P1) — Session step naming and coaching copy are hardcoded English. [src/app/(app)/session/session-client.tsx:233]

## Validation Command Status

1. `pnpm lint src/app src/components` -> failed (1 error, 4 warnings). Primary blocker: `Date.now()` purity violation in `src/app/(app)/today/page.tsx:72`.
2. `pnpm tsc --noEmit` -> failed (`TS2719` in `src/hifzer/engine/queue-builder.test.ts:6`).
3. `pnpm audit:clicks` -> failed (Playwright launch blocked by missing `libatk-1.0.so.0`).
4. `pnpm audit:mobile:overflow` -> failed (same Playwright dependency blocker).

## Acceptance Criteria Check

- [x] Every in-scope frontend file is listed as reviewed in `00-file-manifest.csv`.
- [x] Every finding includes severity, file+line evidence, impact, and recommendation.
- [x] Modern and legacy findings are separated by `surface` and by batch.
- [x] Domain batch reports B0..B7 are delivered under `docs/audits/frontend/`.
- [x] Consolidated prioritized roadmap included.

## Immediate Remediation Sequence

1. Environment: install Playwright Linux dependencies and re-run `audit:clicks` + `audit:mobile:overflow`.
2. Quality gate: resolve lint/type blockers to restore CI confidence.
3. UX core: fix nav active-state bug and public mobile menu a11y semantics.
4. Global language: implement `dir` propagation and localize critical workflow copy.
5. Architecture: decompose `session-client.tsx` and remove dark-mode compatibility bridge debt.

