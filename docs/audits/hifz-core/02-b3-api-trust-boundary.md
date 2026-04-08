# B3 - API Trust Boundary

> Archive note: This audit snapshot predates the current super-app pivot and still references older route structures such as `/today`. Treat it as historical analysis, not the current spec.

## Scope
- `src/app/api/session/*`
- `src/app/api/profile/*` (hifz-relevant contract surfaces)

## Severity Matrix
| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 3 |
| P2 | 0 |
| P3 | 0 |
| P4 | 0 |

## Findings
- `HC-B3-001` (P1): `/api/session/complete` lacks strict enum/field validation before engine call.
  - Evidence: `src/app/api/session/complete/route.ts:39`.
- `HC-B3-002` (P1): `/api/session/sync` accepts arbitrary stage values and inferred phases without legal-pair checks.
  - Evidence: `src/app/api/session/sync/route.ts:73`.
- `HC-B3-003` (P1): `ayahId` range is not validated at boundary before persistence.
  - Evidence: `src/app/api/session/complete/route.ts:41`, `src/hifzer/engine/server.ts:897`.

## Boundary Verdict
- Boundary currently trusts client shape and semantics too heavily.
- Expected deterministic 4xx behavior for malformed payloads is not guaranteed.

## Remediation Queue
1. Introduce shared runtime schemas for complete/sync payloads.
2. Validate stage-phase legality matrix explicitly.
3. Validate ayah ID domain (`1..6236`) and reject non-canonical IDs at boundary.
4. Return structured 400 errors for validation failures, not generic 500.
