# B4 - Client Event Integrity

> Archive note: This audit snapshot predates the current super-app pivot and still references older route structures such as `/today`. Treat it as historical analysis, not the current spec.

## Scope
- `src/app/(app)/session/session-client.tsx`
- `src/app/(app)/today/*`
- `src/app/(app)/hifz/*`
- `src/hifzer/local/store.ts`
- `src/hifzer/focus/*`

## Severity Matrix
| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 1 |
| P2 | 0 |
| P3 | 0 |
| P4 | 0 |

## Findings
- `HC-B4-001` (P1): Quick-review mode removes gate/new steps but still triggers session completion.
  - Evidence: `src/app/(app)/session/session-client.tsx:120`, `src/app/(app)/session/session-client.tsx:793`.
  - Impact: With weak server enforcement, filtered runs can finalize gate-required sessions.

## Notes
- Client-side UX checks (warmup interstitial/review-only lock) are helpful but not security controls.
- Server must own gate truth; client should not be relied upon for integrity-critical enforcement.

## Remediation Queue
1. Prevent quick-review completion for gate-required sessions unless server issues a dedicated review-only run token.
2. Include server-validated completion summary response and reconcile client state from server outcome.
