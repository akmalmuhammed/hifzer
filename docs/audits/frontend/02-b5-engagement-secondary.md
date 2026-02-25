# B5 — Engagement + Secondary Surfaces

Generated: 2026-02-25T11:03:32.988Z

## Scope Coverage

- Files reviewed: 37
- LOC reviewed: 4078
- Findings captured: 5

## Severity Matrix

| Severity | Count |
|---|---:|
| P0 | 0 |
| P1 | 0 |
| P2 | 4 |
| P3 | 1 |
| P4 | 0 |

## Findings

### F-B5-001 — P2 — i18n_l10n_rtl

- Evidence: `src/app/(app)/dashboard/dashboard-client.tsx:366` — Header/title/subtitle/KPI labels are literals with no language abstraction.
- Summary: Dashboard command-deck copy and controls are hardcoded English.
- User impact: Engagement analytics surface is inconsistent with selected app language.
- Recommendation: Introduce localized copy map for dashboard headings, labels, and actions.
- Effort: M
- Confidence: high

### F-B5-002 — P2 — i18n_l10n_rtl

- Evidence: `src/app/(app)/progress/progress-client.tsx:224` — Motivational heading/subtitle and multiple KPI labels are literals.
- Summary: Progress page still uses hardcoded English macro copy.
- User impact: Non-English users lose comprehension in high-value reflection surface.
- Recommendation: Localize progress-page narrative copy and KPI captions.
- Effort: M
- Confidence: high

### F-B5-003 — P2 — i18n_l10n_rtl

- Evidence: `src/app/(app)/streak/streak-client.tsx:354` — Calendar header maps fixed array `[Mon, Tue, Wed, Thu, Fri, Sat, Sun]`.
- Summary: Streak calendar weekday labels are hardcoded English abbreviations.
- User impact: Locale/date cognition degrades for non-English users.
- Recommendation: Generate localized weekday labels via Intl APIs based on active UI language.
- Effort: S
- Confidence: high

### F-B5-004 — P2 — accessibility

- Evidence: `src/components/charts/sparkline.tsx:50` — SVG sets `aria-hidden="true"` while being used for trend cues in dashboard cards.
- Summary: Sparkline chart component is always `aria-hidden`.
- User impact: Assistive-tech users miss trend information that informs decision-making.
- Recommendation: Expose accessible text summary or non-hidden semantic chart alternative.
- Effort: M
- Confidence: medium

### F-B5-005 — P3 — ia_copy

- Evidence: `src/app/(app)/billing/upgrade/page.tsx:87` — Paid plan renders literal `$7 / month` copy with no locale/currency abstraction.
- Summary: Billing plan pricing is hardcoded as USD string.
- User impact: Global users may misinterpret price context and billing assumptions.
- Recommendation: Move plan pricing/currency to configurable billing presentation layer.
- Effort: M
- Confidence: high

## Remediation Queue

1. F-B5-001 (P2) — Dashboard command-deck copy and controls are hardcoded English.
2. F-B5-002 (P2) — Progress page still uses hardcoded English macro copy.
3. F-B5-003 (P2) — Streak calendar weekday labels are hardcoded English abbreviations.
4. F-B5-004 (P2) — Sparkline chart component is always `aria-hidden`.
5. F-B5-005 (P3) — Billing plan pricing is hardcoded as USD string.

## Validation Constraints

- Browser-interaction validation is currently blocked in this environment due missing Playwright system dependency (`libatk-1.0.so.0`).
- Static/code-level evidence and command outputs were used for this batch.

