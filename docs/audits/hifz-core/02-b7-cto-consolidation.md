# B7 - CTO Consolidation

> Archive note: This audit snapshot predates the current super-app pivot and still references older route structures such as `/today`. Treat it as historical analysis, not the current spec.

## Severity Matrix (All Batches)
| Severity | Count |
|---|---|
| P0 | 4 |
| P1 | 13 |
| P2 | 3 |
| P3 | 1 |
| P4 | 0 |

## Top Blockers
1. `HC-B2-001` Session completion is not plan-bound.
2. `HC-B2-002` Gate pass can be forced by omitting gate events.
3. `HC-B2-003` Cursor progression is unbounded by planned range/surah.
4. `HC-B2-006` Client timestamp controls schedule anchoring.
5. `HC-B2-004` Unknown session IDs can create synthetic completion sessions.
6. `HC-B2-005` Duplicate OPEN session race under concurrent start.
7. `HC-B5-001` Browse telemetry writes COMPLETED sessions into shared lifecycle table.
8. `HC-B5-002` Missed-day baseline accepts non-Hifz completions.
9. `HC-B3-001`/`HC-B3-002` API payload validation gaps at trust boundary.
10. `HC-B5-004` Silent degraded mode under schema drift.

## Root Cause Clusters
- Cluster A: Trust boundary weakness.
  - Symptoms: forged/off-plan events, empty-gate bypass, malformed payload 500s.
  - Findings: `HC-B2-001`, `HC-B2-002`, `HC-B3-001`, `HC-B3-002`, `HC-B3-003`.
- Cluster B: Lifecycle/state machine gaps.
  - Symptoms: synthetic sessions, duplicate opens, unbounded cursor movement.
  - Findings: `HC-B2-003`, `HC-B2-004`, `HC-B2-005`.
- Cluster C: Cross-feature data contamination.
  - Symptoms: missed-day drift, lane pollution, misleading policy behavior.
  - Findings: `HC-B5-001`, `HC-B5-002`, `HC-B5-003`.
- Cluster D: Silent compatibility degradation.
  - Symptoms: normal-looking responses while core retention logic is partially disabled.
  - Findings: `HC-B5-004`, `HC-B5-005`.
- Cluster E: Safety-net insufficiency.
  - Symptoms: critical paths not regression-protected.
  - Findings: `HC-B6-001`, `HC-B6-002`.

## Ordered Remediation Roadmap
1. Phase 1 - Hard-stop integrity fixes (P0/P1 trust boundary)
- Implement strict event schema validation at `/api/session/complete` and `/api/session/sync`.
- Enforce plan-bound event acceptance and mandatory gate evidence checks.
- Reject unknown session completion; require existing OPEN session.
- Add cursor and ayah domain bounds.

2. Phase 2 - Lifecycle hardening
- Add single-open-session invariant at DB + transaction layer.
- Bound timestamp skew and move schedule anchoring to server-trusted time.

3. Phase 3 - Data model isolation
- Separate Qur'an browse telemetry from Hifz session completion semantics.
- Recompute missed-day baseline using Hifz-only evidence.
- Filter learning lane derivation to Hifz-relevant events.

4. Phase 4 - Degraded mode clarity
- Expose explicit degraded capability flags in APIs and UI.
- Add runtime operational signal when schema patching fails.

5. Phase 5 - Regression net
- Add integration/concurrency tests for all P0/P1 controls.
- Fix lint purity issue and keep scoped lint clean.

## Exit Gate
- No open P0 findings.
- All P1 findings either fixed or have approved mitigation + timeline.
- Invariant matrix statuses for INV-007/008/009/010 changed from Broken to Pass.
