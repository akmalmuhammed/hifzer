# B0 — Foundations + Design System

> Archive note: This audit snapshot predates the current super-app pivot and still references older route structures such as `/today`. Treat it as historical analysis, not the current spec.

Generated: 2026-02-25T11:03:32.988Z

## Scope Coverage

- Files reviewed: 45
- LOC reviewed: 3929
- Findings captured: 10

## Severity Matrix

| Severity | Count |
|---|---:|
| P0 | 0 |
| P1 | 5 |
| P2 | 4 |
| P3 | 1 |
| P4 | 0 |

## Findings

### F-B0-001 — P1 — i18n_l10n_rtl

- Evidence: `src/app/layout.tsx:110` — Root layout sets `lang` but does not set `dir` on `<html>`.
- Summary: Global document direction is not set for RTL interface languages.
- User impact: Urdu/Persian users get mixed-direction layouts and inconsistent alignment across navigation/settings.
- Recommendation: Compute and set `dir` server-side from UI language, and keep it in sync client-side.
- Effort: M
- Confidence: high

### F-B0-002 — P1 — i18n_l10n_rtl

- Evidence: `src/components/providers/ui-language-provider.tsx:27` — `setLanguage` writes cookie + `document.documentElement.lang` only.
- Summary: Client language switch updates `lang` but never updates `dir`.
- User impact: Switching to RTL language does not mirror UI direction at runtime.
- Recommendation: Set `document.documentElement.dir` based on `isUiLanguageRtl` whenever language changes.
- Effort: S
- Confidence: high

### F-B0-006 — P1 — performance

- Evidence: `src/middleware.ts:68` — Runtime warning: `middleware` convention deprecated in Next 16 in favor of `proxy`.
- Summary: Routing middleware uses a deprecated Next.js file convention.
- User impact: Future upgrades can break auth/routing guards with reduced lead time.
- Recommendation: Migrate to `proxy` convention and validate route protection parity.
- Effort: M
- Confidence: high

### F-B0-007 — P1 — performance

- Evidence: `src/app/(app)/today/page.tsx:72` — `react-hooks/purity` flags render-time impure function usage.
- Summary: `Date.now()` is called during render, failing purity lint.
- User impact: Build quality gate fails; behavior can drift across rerenders.
- Recommendation: Compute now-time outside render path (precomputed value or memoized server value).
- Effort: S
- Confidence: high

### F-B0-009 — P1 — responsive_mobile

- Evidence: `scripts/click-routing-audit.mjs:83` — `chromium_headless_shell` fails to launch: `libatk-1.0.so.0` missing.
- Summary: Automated frontend audits are blocked by missing Playwright system dependency.
- User impact: Critical routing/mobile QA cannot run in this environment, leaving blind spots in release validation.
- Recommendation: Install required Playwright OS deps in dev/CI image and gate releases on audit job success.
- Effort: M
- Confidence: high

### F-B0-003 — P2 — navigation

- Evidence: `src/components/app/app-shell.tsx:73` — `isActive` returns true for `/` when href is both `/` and `/today`.
- Summary: Home and Today can both appear active on `/`.
- User impact: Confusing route state in primary navigation reduces orientation confidence.
- Recommendation: Use mutually exclusive active rules for Home vs Today.
- Effort: S
- Confidence: high

### F-B0-004 — P2 — interaction_feedback

- Evidence: `src/components/ui/button.tsx:103` — Loading label is always `Working` and spinner colors are fixed for white backgrounds.
- Summary: Button loading state is hardcoded and variant-insensitive.
- User impact: Non-English users see untranslated status; contrast/readability degrades on light variants.
- Recommendation: Expose localized loading labels and token-driven spinner colors per variant.
- Effort: M
- Confidence: high

### F-B0-005 — P2 — consistency_design_system

- Evidence: `src/app/globals.css:458` — Compatibility bridge remaps `bg-white/*`, `hover:bg-white/*`, and `bg-black/*` selectors globally.
- Summary: Dark mode depends on broad class-substring overrides with `!important`.
- User impact: Theme behavior is brittle and hard to predict; future components can regress unexpectedly.
- Recommendation: Replace global override bridge with tokenized component styles and targeted migrations.
- Effort: L
- Confidence: high

### F-B0-008 — P2 — consistency_design_system

- Evidence: `src/hifzer/engine/queue-builder.test.ts:6` — `pnpm tsc --noEmit` exits with TS2719 mismatch in queue-builder test fixture typing.
- Summary: Typecheck fails due incompatible `quranActiveSurahNumber` optionality.
- User impact: Type-safety baseline is red, reducing trust in regression detection.
- Recommendation: Align fixture type with current profile type contract and enforce via shared helper.
- Effort: S
- Confidence: high

### F-B0-010 — P3 — consistency_design_system

- Evidence: `src/hifzer/i18n/app-ui-copy.ts:109` — `applyInterfaceLanguage` and `interfaceLanguageUpdated` are defined but not consumed by UI controls.
- Summary: Interface-language copy contract has unused action/status keys.
- User impact: Copy model and behavior diverge; users get inconsistent expectations in settings.
- Recommendation: Either wire explicit apply/confirmation UX or remove dead keys and simplify contract.
- Effort: S
- Confidence: high

## Remediation Queue

1. F-B0-001 (P1) — Global document direction is not set for RTL interface languages.
2. F-B0-002 (P1) — Client language switch updates `lang` but never updates `dir`.
3. F-B0-006 (P1) — Routing middleware uses a deprecated Next.js file convention.
4. F-B0-007 (P1) — `Date.now()` is called during render, failing purity lint.
5. F-B0-009 (P1) — Automated frontend audits are blocked by missing Playwright system dependency.
6. F-B0-003 (P2) — Home and Today can both appear active on `/`.
7. F-B0-004 (P2) — Button loading state is hardcoded and variant-insensitive.
8. F-B0-005 (P2) — Dark mode depends on broad class-substring overrides with `!important`.
