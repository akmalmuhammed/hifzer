# B4 — Core Feature Workflows

Generated: 2026-02-25T11:03:32.988Z

## Scope Coverage

- Files reviewed: 31
- LOC reviewed: 6452
- Findings captured: 7

## Severity Matrix

| Severity | Count |
|---|---:|
| P0 | 0 |
| P1 | 2 |
| P2 | 4 |
| P3 | 1 |
| P4 | 0 |

## Findings

### F-B4-001 — P1 — i18n_l10n_rtl

- Evidence: `src/app/(app)/today/today-client.tsx:303` — `PageHeader` eyebrow/title/subtitle and action labels are literal strings.
- Summary: Today core workflow header/copy is hardcoded English.
- User impact: Daily execution surface does not respect selected language.
- Recommendation: Localize all today-flow labels and status strings via shared copy provider.
- Effort: M
- Confidence: high

### F-B4-002 — P1 — i18n_l10n_rtl

- Evidence: `src/app/(app)/session/session-client.tsx:233` — `stepTitle`/`stepSummary` return literals for core memorization states.
- Summary: Session step naming and coaching copy are hardcoded English.
- User impact: Highest-frequency recitation loop remains non-localized for non-English users.
- Recommendation: Externalize session-state labels/descriptions into language copy maps.
- Effort: L
- Confidence: high

### F-B4-003 — P2 — ia_copy

- Evidence: `src/app/(app)/today/today-client.tsx:27` — Catch-up message references fixed `45%` threshold directly in string literal.
- Summary: Mode guidance text hardcodes debt threshold value in UI copy.
- User impact: If engine thresholds change, UI explanations become inaccurate.
- Recommendation: Read threshold from server payload/config and interpolate dynamically.
- Effort: M
- Confidence: high

### F-B4-004 — P2 — interaction_feedback

- Evidence: `src/app/(app)/quran/read/page.tsx:246` — Tracking, view, phonetic, and translation toggles are rendered as `<Link>` elements.
- Summary: Reader mode/detail toggles are navigation links, not in-place controls.
- User impact: Every toggle causes full navigation and potential focus/scroll loss.
- Recommendation: Use client-side control components with state sync and preserved viewport context.
- Effort: M
- Confidence: high

### F-B4-005 — P2 — ia_copy

- Evidence: `src/app/(app)/quran/read/reader-preferences-controls.tsx:97` — Language warning prints original backend error string to end-user.
- Summary: Reader preferences expose raw persistence diagnostics.
- User impact: Technical schema details leak into UX and obscure recovery actions.
- Recommendation: Translate backend failures into user-facing guidance and retain raw errors in logs.
- Effort: S
- Confidence: high

### F-B4-006 — P2 — consistency_design_system

- Evidence: `src/app/(app)/session/session-client.tsx:1` — Single file currently spans ~1,372 LOC with state machine, copy, sync, and rendering tightly coupled.
- Summary: Session client is a very large monolith with mixed responsibilities.
- User impact: Change risk and onboarding cost for core recitation flow are high.
- Recommendation: Split by domain (state machine, persistence, controls, presentation) with typed module boundaries.
- Effort: L
- Confidence: high

### F-B4-007 — P3 — interaction_feedback

- Evidence: `src/app/(app)/quran/read/page.tsx:365` — Hero/filter/status surfaces are conditionally hidden when mode is enabled.
- Summary: Distraction-free reader state removes context blocks without explicit mode banner.
- User impact: Users may not understand why controls disappear after mode switch.
- Recommendation: Add subtle persistent mode badge with clear exit affordance.
- Effort: S
- Confidence: medium

## Remediation Queue

1. F-B4-001 (P1) — Today core workflow header/copy is hardcoded English.
2. F-B4-002 (P1) — Session step naming and coaching copy are hardcoded English.
3. F-B4-003 (P2) — Mode guidance text hardcodes debt threshold value in UI copy.
4. F-B4-004 (P2) — Reader mode/detail toggles are navigation links, not in-place controls.
5. F-B4-005 (P2) — Reader preferences expose raw persistence diagnostics.
6. F-B4-006 (P2) — Session client is a very large monolith with mixed responsibilities.
7. F-B4-007 (P3) — Distraction-free reader state removes context blocks without explicit mode banner.

## Validation Constraints

- Browser-interaction validation is currently blocked in this environment due missing Playwright system dependency (`libatk-1.0.so.0`).
- Static/code-level evidence and command outputs were used for this batch.

