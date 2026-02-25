# B6 — Legacy Surface

Generated: 2026-02-25T11:03:32.988Z

## Scope Coverage

- Files reviewed: 44
- LOC reviewed: 4886
- Findings captured: 5

## Severity Matrix

| Severity | Count |
|---|---:|
| P0 | 0 |
| P1 | 1 |
| P2 | 3 |
| P3 | 1 |
| P4 | 0 |

## Findings

### F-B6-001 — P1 — accessibility

- Evidence: `src/_legacy/components/shell/command-palette.tsx:314` — No focus trap/inert background management accompanies `role=dialog` + `aria-modal=true`.
- Summary: Legacy command palette is marked dialog but lacks robust modal behavior.
- User impact: Keyboard/screen-reader users can lose context or focus behind overlay.
- Recommendation: Implement managed dialog primitives with focus lock and return-focus semantics.
- Effort: M
- Confidence: high

### F-B6-002 — P2 — responsive_mobile

- Evidence: `src/_legacy/components/shell/app-shell.tsx:201` — Fixed bottom nav uses static padding without `env(safe-area-inset-bottom)` handling.
- Summary: Legacy mobile bottom nav ignores safe-area inset spacing.
- User impact: On iOS devices, controls can sit too close to or overlap system home indicator area.
- Recommendation: Add safe-area-aware bottom padding utilities for fixed legacy navigation.
- Effort: S
- Confidence: high

### F-B6-003 — P2 — i18n_l10n_rtl

- Evidence: `src/_legacy/components/shell/app-shell.tsx:131` — UI labels like `Search everything`, `Ctrl K`, and action labels are hardcoded.
- Summary: Legacy shell copy remains English-only and shortcut-centric.
- User impact: Legacy routes are not usable in multilingual contexts.
- Recommendation: Localize legacy shell strings or gate legacy routes from multilingual navigation paths.
- Effort: M
- Confidence: high

### F-B6-005 — P2 — consistency_design_system

- Evidence: `src/components/shell/protected-layout.tsx:1` — `src/components/shell/protected-layout.tsx` is a pass-through to `_legacy` implementation.
- Summary: Active shell wrapper re-exports legacy protected layout directly.
- User impact: Legacy assumptions continue leaking into modern architecture and increase migration drag.
- Recommendation: Create non-legacy protected-layout implementation and isolate legacy path dependencies.
- Effort: M
- Confidence: high

### F-B6-004 — P3 — accessibility

- Evidence: `src/_legacy/components/shell/app-shell.tsx:207` — Active styling is visual-only; links do not set `aria-current`.
- Summary: Legacy nav links do not expose active route semantics.
- User impact: Assistive-tech users receive weaker orientation cues in legacy navigation.
- Recommendation: Set `aria-current=page` for active legacy nav links.
- Effort: S
- Confidence: high

## Remediation Queue

1. F-B6-001 (P1) — Legacy command palette is marked dialog but lacks robust modal behavior.
2. F-B6-002 (P2) — Legacy mobile bottom nav ignores safe-area inset spacing.
3. F-B6-003 (P2) — Legacy shell copy remains English-only and shortcut-centric.
4. F-B6-005 (P2) — Active shell wrapper re-exports legacy protected layout directly.
5. F-B6-004 (P3) — Legacy nav links do not expose active route semantics.

