# B6 - Coverage + Runtime Signals

## Scope
- Unit tests under `src/hifzer/engine/*.test.ts`, `src/hifzer/srs/*.test.ts`
- Lint/runtime checks over audited paths

## Severity Matrix
| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 2 |
| P2 | 1 |
| P3 | 1 |
| P4 | 0 |

## Findings
- `HC-B6-001` (P1): No direct tests for completion trust boundary and forged payload protection.
  - Evidence: `src/hifzer/engine/server.ts:786`.
- `HC-B6-002` (P1): No concurrency tests for open-session race behavior.
  - Evidence: `src/hifzer/engine/server.ts:502`.
- `HC-B6-003` (P2): Lint purity violation in today page (`Date.now()` during render).
  - Evidence: `src/app/(app)/today/page.tsx:72`.
- `HC-B6-004` (P3): Minor route hygiene issue (unused error variable).
  - Evidence: `src/app/api/profile/learning-lanes/route.ts:18`.

## Executed Checks
- `pnpm test src/hifzer/engine/policies.test.ts src/hifzer/engine/queue-builder.test.ts src/hifzer/srs/update.test.ts src/hifzer/srs/queue.test.ts` -> pass.
- `pnpm lint ...` on scoped paths -> failed on today purity rule and one warning.

## Remediation Queue
1. Add integration tests for `completeSession` adversarial inputs and gate coverage requirements.
2. Add concurrency test for duplicate-open-session prevention.
3. Fix purity lint issue by replacing render-time `Date.now()` with deterministic value.
4. Clean minor lint warning for route code hygiene.
