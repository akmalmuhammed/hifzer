# B0 - Invariants + Contracts

> Archive note: This audit snapshot predates the current super-app pivot and still references older route structures such as `/today`. Treat it as historical analysis, not the current spec.

## Scope
- `src/hifzer/engine/types.ts`
- `src/hifzer/srs/types.ts`
- `src/app/(app)/today/today-types.ts`
- Contract cross-checks against API payload shapes and session plan snapshot fields.

## Severity Matrix
| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 0 |
| P2 | 0 |
| P3 | 0 |
| P4 | 0 |

## Findings
- No standalone B0 finding was logged.
- Output of this batch is the invariant baseline in `98-invariant-matrix.md` used by B1-B7.

## Notes
- Session plan snapshot schema exists and is versioned, but lifecycle enforcement against that schema occurs later in B2/B3 and is currently insufficient.

## Remediation Queue
1. Keep contract definitions centralized and reuse one runtime validator for `/api/session/complete` and `/api/session/sync`.
2. Add explicit invariant checks in code comments/tests for each `TodayEngineResult` gate/control flag.
