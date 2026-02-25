# B5 - Persistence + Compat Drift

## Scope
- `src/hifzer/profile/server.ts`
- `src/lib/db-compat.ts` (referenced in analysis)
- `src/hifzer/quran/read-progress.server.ts`
- Supporting quran/profile persistence surfaces

## Severity Matrix
| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 4 |
| P2 | 1 |
| P3 | 0 |
| P4 | 0 |

## Findings
- `HC-B5-001` (P1): Qur'an browse markers are stored as COMPLETED sessions in shared Hifz session table.
  - Evidence: `src/hifzer/quran/read-progress.server.ts:121`.
- `HC-B5-002` (P1): Missed-day baseline uses latest generic COMPLETED session.
  - Evidence: `src/hifzer/engine/server.ts:375`.
- `HC-B5-003` (P1): Learning lanes are derived from all review events without stage filtering.
  - Evidence: `src/hifzer/profile/server.ts:562`.
- `HC-B5-005` (P2): Runtime schema patch failures are swallowed; app continues in compatibility mode silently.
  - Evidence: `src/hifzer/profile/server.ts:292`.
- `HC-B5-004` (P1): Missing-schema fallback returns normal-looking today state despite core-feature degradation.
  - Evidence: `src/hifzer/engine/server.ts:444`.

## Persistence Verdict
- Cross-feature contamination and silent degradation are the dominant long-run risks.
- Data model needs clearer separation between Hifz lifecycle and Qur'an browse telemetry.

## Remediation Queue
1. Split session telemetry types or separate browse session storage from Hifz sessions.
2. Restrict missed-day policy inputs to true Hifz completion signals.
3. Filter learning lanes to memorization-relevant stages.
4. Surface hard degraded-mode flags when core schema capabilities are missing.
5. Add operator-visible health check for runtime schema compatibility status.
