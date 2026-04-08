# B2 — Onboarding

> Archive note: This audit snapshot predates the current super-app pivot and still references older route structures such as `/today`. Treat it as historical analysis, not the current spec.

Generated: 2026-02-25T11:03:32.988Z

## Scope Coverage

- Files reviewed: 9
- LOC reviewed: 842
- Findings captured: 7

## Severity Matrix

| Severity | Count |
|---|---:|
| P0 | 0 |
| P1 | 1 |
| P2 | 4 |
| P3 | 2 |
| P4 | 0 |

## Findings

### F-B2-003 — P1 — state_loading_empty_error

- Evidence: `src/app/(onboarding)/onboarding/start-point/page.tsx:75` — POST response is awaited but `res.ok` is never checked before success toast + navigation.
- Summary: Onboarding start-point save path does not validate API response success.
- User impact: Users can be told setup succeeded even when persistence failed.
- Recommendation: Validate `res.ok`, surface actionable error feedback, and block progression on failed persistence.
- Effort: S
- Confidence: high

### F-B2-001 — P2 — i18n_l10n_rtl

- Evidence: `src/app/(onboarding)/onboarding/welcome/page.tsx:16` — Eyebrow/title/subtitle/about/CTA strings are literal text.
- Summary: Onboarding welcome copy is hardcoded English.
- User impact: Language-selected users hit an English-only onboarding start.
- Recommendation: Localize onboarding content through shared copy dictionaries.
- Effort: M
- Confidence: high

### F-B2-002 — P2 — i18n_l10n_rtl

- Evidence: `src/app/(onboarding)/onboarding/start-point/page.tsx:99` — Headers, labels, placeholders, status pills, and helper text are literal strings.
- Summary: Start-point flow is fully hardcoded in English.
- User impact: Core setup flow diverges from selected language and raises cognitive load.
- Recommendation: Extract onboarding-start strings into localized copy and reuse language provider.
- Effort: M
- Confidence: high

### F-B2-004 — P2 — accessibility

- Evidence: `src/app/(onboarding)/onboarding/start-point/page.tsx:147` — Input relies on placeholder text only (`Search surah by number or name...`).
- Summary: Surah search field lacks an explicit label.
- User impact: Screen-reader and cognitive-access users have weaker form context.
- Recommendation: Add visible or sr-only label bound to input id.
- Effort: S
- Confidence: high

### F-B2-006 — P2 — state_loading_empty_error

- Evidence: `src/app/(onboarding)/onboarding/plan-preview/page.tsx:64` — `new Date(`${localDate}T00:00:00Z`)` then `setUTCDate` builds week rows.
- Summary: Plan preview date loop coerces local date to UTC midnight.
- User impact: Timezone offsets can shift displayed day sequencing versus user expectation.
- Recommendation: Use local date arithmetic utilities tied to profile timezone semantics.
- Effort: M
- Confidence: high

### F-B2-005 — P3 — state_loading_empty_error

- Evidence: `src/app/(onboarding)/onboarding/start-point/page.tsx:71` — `localStorage.setItem` calls execute without try/catch fallback path.
- Summary: Local storage writes are unguarded in onboarding save flow.
- User impact: Private browsing/storage restrictions can fail silently and desync onboarding state.
- Recommendation: Wrap storage writes in guarded utility and provide fallback messaging.
- Effort: S
- Confidence: medium

### F-B2-007 — P3 — state_loading_empty_error

- Evidence: `src/app/(onboarding)/onboarding/plan-preview/page.tsx:107` — Error copy renders in text path but no retry button/action is offered.
- Summary: Plan-preview error state lacks direct recovery affordance.
- User impact: Users can stall in onboarding when transient fetch errors occur.
- Recommendation: Add retry action and fallback route CTA in error branch.
- Effort: S
- Confidence: high

## Remediation Queue

1. F-B2-003 (P1) — Onboarding start-point save path does not validate API response success.
2. F-B2-001 (P2) — Onboarding welcome copy is hardcoded English.
3. F-B2-002 (P2) — Start-point flow is fully hardcoded in English.
4. F-B2-004 (P2) — Surah search field lacks an explicit label.
5. F-B2-006 (P2) — Plan preview date loop coerces local date to UTC midnight.
6. F-B2-005 (P3) — Local storage writes are unguarded in onboarding save flow.
7. F-B2-007 (P3) — Plan-preview error state lacks direct recovery affordance.
