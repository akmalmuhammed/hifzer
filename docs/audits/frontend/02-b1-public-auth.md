# B1 — Public + Auth

Generated: 2026-02-25T11:03:32.988Z

## Scope Coverage

- Files reviewed: 39
- LOC reviewed: 3088
- Findings captured: 8

## Severity Matrix

| Severity | Count |
|---|---:|
| P0 | 0 |
| P1 | 2 |
| P2 | 4 |
| P3 | 2 |
| P4 | 0 |

## Findings

### F-B1-001 — P1 — navigation

- Evidence: `e2e/routing.public.spec.ts:4` — `CTA_ROUTES`, CORS checks, and canonical tests reference `/pricing`.
- Summary: Public routing tests still target `/pricing`, which is no longer a current public route.
- User impact: Core public QA coverage is stale and fails to validate the live information architecture.
- Recommendation: Replace `/pricing` checks with active public route set (e.g., `/compare`) and update selectors accordingly.
- Effort: S
- Confidence: high

### F-B1-002 — P1 — navigation

- Evidence: `e2e/routing.public.spec.ts:69` — Spec expects redirect; observed status can be 200 when Clerk gating is disabled.
- Summary: Signed-out `/quran` auth expectation diverges from current runtime behavior.
- User impact: Access model is environment-sensitive and difficult to reason about across staging/prod.
- Recommendation: Document and enforce explicit behavior matrix for auth-enabled vs auth-disabled deployments.
- Effort: M
- Confidence: high

### F-B1-003 — P2 — accessibility

- Evidence: `src/components/landing/marketing-nav.tsx:92` — Button includes `aria-label` but no `aria-expanded` or `aria-controls`.
- Summary: Mobile menu toggle lacks expanded-state semantics.
- User impact: Screen-reader users do not receive reliable open/closed state feedback.
- Recommendation: Add `aria-expanded`, `aria-controls`, and stable target id linkage.
- Effort: S
- Confidence: high

### F-B1-004 — P2 — accessibility

- Evidence: `src/components/landing/marketing-nav.tsx:103` — Drawer is a toggled `<div>` with no role/dialog semantics, no focus trap, and no Escape handling.
- Summary: Mobile nav drawer is not implemented as an accessible modal pattern.
- User impact: Keyboard focus can escape behind drawer and navigation context becomes ambiguous.
- Recommendation: Implement modal nav pattern with focus trap, Escape close, and inert background.
- Effort: M
- Confidence: high

### F-B1-005 — P2 — i18n_l10n_rtl

- Evidence: `src/components/landing/hero.tsx:75` — Primary badge, headline, subtitle, and CTA labels are literal strings.
- Summary: Hero messaging is hardcoded in English and bypasses i18n copy system.
- User impact: Language switcher creates inconsistent bilingual UX on first-touch conversion surface.
- Recommendation: Move marketing hero strings into localized copy dictionaries and use language context.
- Effort: M
- Confidence: high

### F-B1-006 — P2 — i18n_l10n_rtl

- Evidence: `src/app/(auth)/login/[[...login]]/page.tsx:29` — Title, subtitle, fallback content, and account-link text are literals.
- Summary: Auth screen text is hardcoded in English.
- User impact: Localized marketing shell drops to English at login boundary.
- Recommendation: Map auth strings into app UI copy and render by selected language.
- Effort: M
- Confidence: high

### F-B1-007 — P3 — ia_copy

- Evidence: `src/app/(auth)/login/[[...login]]/page.tsx:36` — Fallback panel prints `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` placeholders.
- Summary: Auth misconfiguration state exposes internal env variable names directly.
- User impact: In misconfigured deploys, end-user trust drops due developer-facing messaging.
- Recommendation: Replace with user-friendly support guidance and hide internal config names.
- Effort: S
- Confidence: high

### F-B1-008 — P3 — visual_hierarchy

- Evidence: `src/components/landing/hero.tsx:100` — Primary button plus secondary button plus tertiary text link all target similar signup/open intent.
- Summary: Hero contains multiple near-duplicate primary CTAs.
- User impact: Choice overload weakens conversion clarity, especially on mobile.
- Recommendation: Consolidate to one primary and one secondary action per viewport.
- Effort: S
- Confidence: medium

## Remediation Queue

1. F-B1-001 (P1) — Public routing tests still target `/pricing`, which is no longer a current public route.
2. F-B1-002 (P1) — Signed-out `/quran` auth expectation diverges from current runtime behavior.
3. F-B1-003 (P2) — Mobile menu toggle lacks expanded-state semantics.
4. F-B1-004 (P2) — Mobile nav drawer is not implemented as an accessible modal pattern.
5. F-B1-005 (P2) — Hero messaging is hardcoded in English and bypasses i18n copy system.
6. F-B1-006 (P2) — Auth screen text is hardcoded in English.
7. F-B1-007 (P3) — Auth misconfiguration state exposes internal env variable names directly.
8. F-B1-008 (P3) — Hero contains multiple near-duplicate primary CTAs.

## Validation Constraints

- Browser-interaction validation is currently blocked in this environment due missing Playwright system dependency (`libatk-1.0.so.0`).
- Static/code-level evidence and command outputs were used for this batch.

