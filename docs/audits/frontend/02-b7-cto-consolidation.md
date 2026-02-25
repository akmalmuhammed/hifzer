# B7 — CTO Consolidation

Generated: 2026-02-25T11:03:32.988Z

## Consolidated Counts

- Total findings: 49
- Modern findings: 44
- Legacy findings: 5

## Root Cause Clusters

| Category | Findings |
|---|---:|
| i18n_l10n_rtl | 13 |
| consistency_design_system | 6 |
| accessibility | 6 |
| ia_copy | 6 |
| state_loading_empty_error | 5 |
| navigation | 4 |
| interaction_feedback | 4 |
| performance | 2 |
| responsive_mobile | 2 |
| visual_hierarchy | 1 |

## Priority Sequence

1. Unblock QA automation environment (Playwright OS deps) and re-run routing/mobile audits.
2. Fix platform/code-quality blockers (middleware deprecation, lint purity, typecheck mismatch).
3. Close navigation/accessibility gaps on global/public shells.
4. Ship localization parity for core workflows (Today/Session/Quran/Onboarding/Settings).
5. Reduce structural risk (session monolith split, token migration away from dark-mode bridge hacks).
6. Isolate or modernize legacy shell to stop design-system drift.

