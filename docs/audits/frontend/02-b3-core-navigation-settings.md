# B3 — Core App Navigation + Settings

> Archive note: This audit snapshot predates the current super-app pivot and still references older route structures such as `/today`. Treat it as historical analysis, not the current spec.

Generated: 2026-02-25T11:03:32.988Z

## Scope Coverage

- Files reviewed: 20
- LOC reviewed: 1281
- Findings captured: 7

## Severity Matrix

| Severity | Count |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 6 |
| P3 | 1 |
| P4 | 0 |

## Findings

### F-B3-001 — P2 — i18n_l10n_rtl

- Evidence: `src/app/(app)/settings/page.tsx:17` — Most titles/descriptions are hardcoded literals while only a subset uses copy dictionaries.
- Summary: Settings hub is only partially localized.
- User impact: Language switch leads to mixed-language settings IA and weak trust in localization.
- Recommendation: Move all settings card titles/descriptions into i18n copy map.
- Effort: M
- Confidence: high

### F-B3-002 — P2 — ia_copy

- Evidence: `src/app/(app)/settings/display/page.tsx:12` — `paidEnabled()` always returns `false`.
- Summary: Display upsell controls are permanently locked by hardcoded feature flag.
- User impact: Users see controls they cannot unlock, creating confusion and perceived brokenness.
- Recommendation: Back feature gating with real entitlement state or hide unavailable controls.
- Effort: M
- Confidence: high

### F-B3-003 — P2 — state_loading_empty_error

- Evidence: `src/app/(app)/settings/display/page.tsx:84` — POST `/api/profile/display` catch block ignores errors entirely.
- Summary: Display persistence failures are swallowed silently.
- User impact: Users think preferences saved when backend persistence may have failed.
- Recommendation: Show explicit non-blocking save-status toast and retry path on failure.
- Effort: S
- Confidence: high

### F-B3-004 — P2 — interaction_feedback

- Evidence: `src/components/app/ui-language-switcher.tsx:26` — `onChange` calls `setLanguage` then `router.refresh()` without explicit apply step.
- Summary: Language switch immediately refreshes route on every select change.
- User impact: Users can lose in-progress context while exploring language options.
- Recommendation: Provide explicit Apply action or optimistic inline update with deferred refresh.
- Effort: M
- Confidence: high

### F-B3-005 — P2 — ia_copy

- Evidence: `src/app/(app)/settings/language/language-client.tsx:124` — UI prints original error string (including schema diagnostics) in warning block.
- Summary: Language settings surface raw backend persistence diagnostics to users.
- User impact: Technical errors increase anxiety and do not guide user recovery.
- Recommendation: Map backend failure classes to user-safe guidance with optional debug logging.
- Effort: S
- Confidence: high

### F-B3-007 — P2 — navigation

- Evidence: `src/components/app/app-shell.tsx:159` — When enabled, effect unconditionally `router.replace('/quran/read?view=compact')` for non-whitelisted routes.
- Summary: Distraction-free mode force-redirects users from non-core routes without context.
- User impact: Users can be disoriented when settings/support pages unexpectedly jump away.
- Recommendation: Add transition notice and intentional route handoff (toast/modal) before redirect.
- Effort: M
- Confidence: high

### F-B3-006 — P3 — consistency_design_system

- Evidence: `src/hifzer/i18n/app-ui-copy.ts:109` — Apply/update-specific copy keys exist, but UI currently auto-applies with no explicit confirmation control.
- Summary: Language-copy schema and settings UI interaction model are out of sync.
- User impact: Users and translators see wording for flows that do not exist.
- Recommendation: Align copy schema with actual interaction model and remove stale keys.
- Effort: S
- Confidence: high

## Remediation Queue

1. F-B3-001 (P2) — Settings hub is only partially localized.
2. F-B3-002 (P2) — Display upsell controls are permanently locked by hardcoded feature flag.
3. F-B3-003 (P2) — Display persistence failures are swallowed silently.
4. F-B3-004 (P2) — Language switch immediately refreshes route on every select change.
5. F-B3-005 (P2) — Language settings surface raw backend persistence diagnostics to users.
6. F-B3-007 (P2) — Distraction-free mode force-redirects users from non-core routes without context.
7. F-B3-006 (P3) — Language-copy schema and settings UI interaction model are out of sync.
