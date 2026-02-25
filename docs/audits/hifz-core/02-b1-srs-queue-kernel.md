# B1 - SRS + Queue Kernel

## Scope
- `engine/{debt,mode-manager,review-allocation,gates,transitions,checkpoints,queue-builder}`
- `srs/{intervals,update,queue}`

## Severity Matrix
| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 1 |
| P2 | 1 |
| P3 | 0 |
| P4 | 0 |

## Findings
- `HC-B1-001` (P1): Practice-day preference is not used by missed-day/queue policy.
  - Evidence: `src/hifzer/engine/queue-builder.ts:52`, `src/app/api/profile/assessment/route.ts:35`.
  - Impact: Rest-day users can be penalized as if they skipped required days.
- `HC-B1-002` (P2): `monthlyTestRequired` is surfaced but not enforceable in queue/gates.
  - Evidence: `src/hifzer/engine/queue-builder.ts:185`, `src/app/(app)/session/session-client.tsx:1265`.
  - Impact: Risk controls appear active but behave as advisory only.

## Branch Notes
- Mode thresholds and review floor rules are deterministic and covered by unit tests.
- Gate evaluator logic is correct for non-empty sets but unsafe when caller can omit gate events (raised in B2/B3).

## Remediation Queue
1. Make missed-day policy practice-day aware or deprecate the setting from onboarding.
2. Convert monthly risk signal into an explicit server-enforced gate or a non-blocking label with accurate copy.
