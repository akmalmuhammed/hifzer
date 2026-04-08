# B2 - Session Lifecycle Core

> Archive note: This audit snapshot predates the current super-app pivot and still references older route structures such as `/today`. Treat it as historical analysis, not the current spec.

## Scope
- `src/hifzer/engine/server.ts`

## Severity Matrix
| Severity | Count |
|---|---|
| P0 | 4 |
| P1 | 2 |
| P2 | 0 |
| P3 | 0 |
| P4 | 0 |

## Findings
- `HC-B2-001` (P0): Completion events are not validated against planned session steps.
  - Evidence: `src/hifzer/engine/server.ts:858`.
- `HC-B2-002` (P0): Empty gate event sets pass warmup/weekly checks.
  - Evidence: `src/hifzer/engine/gates.ts:17`, `src/hifzer/engine/server.ts:942`.
- `HC-B2-003` (P0): Cursor advancement from `NEW_BLIND` is unbounded by plan/surah.
  - Evidence: `src/hifzer/engine/server.ts:953`.
- `HC-B2-006` (P0): Client timestamp controls SRS schedule anchoring.
  - Evidence: `src/hifzer/engine/server.ts:799`.
- `HC-B2-004` (P1): Unknown session IDs trigger synthetic session creation during completion.
  - Evidence: `src/hifzer/engine/server.ts:811`.
- `HC-B2-005` (P1): Start flow has check-then-create race for open sessions.
  - Evidence: `src/hifzer/engine/server.ts:512`.

## Lifecycle Verdict
- Current lifecycle is robust for honest clients.
- Current lifecycle is not robust for forged/malformed/replayed payload variants beyond simple completed-session idempotency.

## Remediation Queue
1. Enforce plan-bound completion validation as a hard server invariant.
2. Fail gates closed when required samples are missing.
3. Clamp cursor and validate ayah IDs against canonical index.
4. Replace client-createdAt trust with server-side time or bounded skew acceptance.
5. Require existing OPEN session on completion.
6. Add uniqueness/locking for one OPEN session per user+localDate.
