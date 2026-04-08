# Hifz Invariant Matrix

> Archive note: This matrix predates the current super-app pivot and still references older route structures such as `/today`. Treat it as historical analysis, not the current spec.

## Scope
- Audited paths: `src/hifzer/{engine,srs,profile,quran,local,focus}`, `src/app/api/{session,profile}`, `src/app/(app)/{hifz,session,today}`
- Reviewed files: 57
- Reviewed LOC: 10,024

## Invariants
| Invariant ID | Lifecycle Stage | Must-Hold Invariant | Primary Evidence | Status | Related Findings |
|---|---|---|---|---|---|
| INV-001 | Queue Build | Missed-day policy must use real Hifz completion signal only. | `engine/server.ts:375` | Risk | `HC-B5-001`, `HC-B5-002` |
| INV-002 | Queue Build | Practice-day preferences must influence missed-day penalties (or be explicitly non-functional). | `engine/queue-builder.ts:52`, `api/profile/assessment/route.ts:35` | Broken | `HC-B1-001` |
| INV-003 | Queue Build | Monthly risk flag must map to enforceable action in queue/gating. | `engine/queue-builder.ts:185`, `session-client.tsx:1265` | Risk | `HC-B1-002` |
| INV-004 | Session Start | Exactly one OPEN session per user/localDate should exist. | `engine/server.ts:512`, `engine/server.ts:623` | Risk | `HC-B2-005` |
| INV-005 | Session Start | Session plan snapshot must be authoritative for completion validation. | `engine/server.ts:583`, `engine/server.ts:644` | Risk | `HC-B2-001` |
| INV-006 | Session Complete | Completion must require existing OPEN session created by start endpoint. | `engine/server.ts:811` | Broken | `HC-B2-004` |
| INV-007 | Session Complete | Submitted events must be subset-equal to planned steps and stage/phase contracts. | `engine/server.ts:829`, `engine/server.ts:869` | Broken | `HC-B2-001`, `HC-B3-001`, `HC-B3-002` |
| INV-008 | Session Complete | Gate pass/fail must fail closed when required gate evidence is missing. | `engine/gates.ts:17`, `engine/server.ts:942` | Broken | `HC-B2-002` |
| INV-009 | Session Complete | Cursor advancement must be bounded by planned new ayah range and surah bounds. | `engine/server.ts:953`, `engine/server.ts:1044` | Broken | `HC-B2-003` |
| INV-010 | Session Complete | Client timestamps must not directly control SRS schedule anchoring without skew bound. | `engine/server.ts:799`, `engine/server.ts:873` | Broken | `HC-B2-006` |
| INV-011 | Session Complete | API should reject malformed enums/time values with deterministic 4xx. | `api/session/complete/route.ts:39`, `api/session/sync/route.ts:73` | Broken | `HC-B3-001`, `HC-B3-002` |
| INV-012 | Session Complete | Ayah IDs must be canonical bounded range before persistence. | `api/session/complete/route.ts:41`, `engine/server.ts:897` | Broken | `HC-B3-003` |
| INV-013 | Client Flow | Quick-review mode must not finalize gate-required sessions without explicit server review-only contract. | `session-client.tsx:120`, `session-client.tsx:793` | Risk | `HC-B4-001` |
| INV-014 | Persistence | Missing-schema mode must be explicit and not silently return normal-looking state. | `engine/server.ts:444`, `engine/server.ts:499` | Risk | `HC-B5-004` |
| INV-015 | Persistence | Runtime patch failure must surface operator-visible degraded status. | `profile/server.ts:292`, `profile/server.ts:310` | Risk | `HC-B5-005` |
| INV-016 | Cross-feature Isolation | Qur'an browse telemetry must not distort Hifz progression metrics/policies. | `quran/read-progress.server.ts:121`, `profile/server.ts:562` | Broken | `HC-B5-001`, `HC-B5-002`, `HC-B5-003` |
| INV-017 | Test Safety Net | P0/P1 lifecycle controls must have direct automated tests. | `engine/server.ts:786`, `engine/policies.test.ts:1` | Broken | `HC-B6-001`, `HC-B6-002` |
| INV-018 | Runtime Health | Core routes/pages should be lint-clean for deterministic behavior. | `app/(app)/today/page.tsx:72` | Risk | `HC-B6-003` |

## Verdict
- Broken invariants: 10
- Risk invariants: 8
- Pass invariants: 0 explicitly validated as fully hardened under adversarial input

The core concept is directionally strong, but **not long-run safe under adversarial or malformed input** until the P0/P1 controls are implemented.
