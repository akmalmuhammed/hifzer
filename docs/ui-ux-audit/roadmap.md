# Hifzer UI/UX audit — implementation roadmap

Date: 2026-09-04
Status: NOW (N0–N7) implemented locally on 2026-09-05; configured external-service staging checks remain release gates

[Executive report](README.md) · [findings](findings.md) · [target experience](target-experience.md)

## Phased roadmap

Effort legend: **XS** ≤2 engineering days; **S** 3–5 days; **M** 1–2 weeks; **L** 3–6 weeks; **XL** multi-release. Estimates are cross-functional ranges to refine after technical spikes, not commitments. “Owner” means accountable discipline; named individuals should be assigned in planning.

| Phase | Sequence and dependencies | Expected impact | Validation | Rollback posture |
| --- | --- | --- | --- | --- |
| NOW — Protect trust | Identity state contract → journal fix → verified save status; staging and privacy-safe telemetry run in parallel | Stop known local data loss and remove the most damaging false-success and trust signals | Deterministic reload/account-switch/offline tests, 320 px visual checks, error-redaction checks, configured staging smoke run | Patch the destructive path directly; feature-flag new presentation components; never roll data backward destructively |
| NEXT — Deliver continuity | Versioned checkpoints → shadow next-action resolver → Today/reader/capture UI; validate IA before shell rollout | Shorter time to meaningful action and exact reading/listening resume | Restore-integrity tests, moderated core tasks, accessibility/RTL matrix, field Core Web Vitals and guarded cohorts | Independent flags for Today, reader toolbar, capture, and adaptive navigation; keep legacy routes/deep links |
| LATER — Deepen practice and guidance | Practice state model before model feedback; canonical source resolver before AI synthesis | Safer, more useful practice feedback and sourced guidance without weakening trust | Model/content evals, permission/failure recovery tests, citation-open/report tasks, conflict/export recovery | Opt-in cohorts and kill switches; preserve manual/non-AI paths and conflict copies |

### NOW — Protect trust (0–2 weeks)

Do this before navigation or visual redesign. The release gate is truthful persistence and safe failure.

| ID | Work package | Owner(s) | Effort | Depends on / sequence |
| --- | --- | --- | --- | --- |
| N0 | Define identity tri-state and audit every destructive local-state transition | Frontend + Platform + Security | S | first; design review before implementation |
| N1 | Fix journal local-owner clearing; add write/read-back result and reload/account-switch tests | Frontend + Platform + QA | M | after N0; P0 blocker |
| N2 | Add persistent `SaveStatus`; keep drafts on write/sync failure; correct saved copy | Frontend + Product Design | S–M | N1 storage result contract |
| N3 | Remove/hide Khatmah rank, named tiers, unlock badges, and celebratory spiritual-status effects | Product + Content Review + Frontend | S | independent; copy approval |
| N4 | Fix 320 reader collision and journal FAB/composer overlap; raise primary reader/bookmark/audio targets to ≥44 px | Frontend + QA/A11y | M | shared hit/safe-area token can land first |
| N5 | Redact audio/AI/auth implementation details and add safe alternate recovery actions | Platform + Frontend + Security | S | error-code mapping |
| N6 | Lock privacy-safe event schema and add save/restore/error instrumentation plus alerting | Data + Security/Privacy + Frontend | M | schema before all experiment events |
| N7 | Establish configured staging accounts and core journey smoke matrix | Platform + QA | M | parallel; required before Next validation |

**Smallest coherent implementation slice — S0 Trustworthy local capture:** N0 → N1 → N2, with the journal overlap part of N4 and capture events from N6. Ship only when a note can be created, visibly verified, reloaded, reopened, edited offline, recovered after simulated failure, and isolated across account transitions. This directly closes the screenshot 37→38 trust break and creates the storage contract reused by plans, bookmarks, and reader checkpoints.

NOW exit criteria: no known journal data-loss reproduction; no “saved” label without verification; no raw secret/configuration text in tested errors; rank UI removed from the core Qur'an flow; 320 px reader and Journal composer smoke tests pass; staging can exercise every target journey.

### NOW implementation readback — 2026-09-05

| Package | Local implementation status | Verification |
| --- | --- | --- |
| N0–N2 | Complete | Identity tri-state, owner-scoped storage, durable journal queue/conflicts/recovery, and verified save status have deterministic tests. |
| N3 | Complete | Rank/tier/locked spiritual-status presentation is replaced with neutral private reading history and guarded by a content test. |
| N4 | Complete | Compact reader/audio/bookmark controls reflow with ≥44 px primary targets; mobile nav reserves content/focus space; 320/390 browser checks and 360/414 route sweeps pass. |
| N5 | Complete | Auth, audio, AI, and root failures use public error contracts, redact provider details, and expose safe recovery paths. |
| N6 | Complete | Product events pass through a versioned allowlist that rejects private content, identifiers, tokens, URL queries, and stack traces; core outcomes are instrumented. |
| N7 | Harness complete | The automated and manual staging matrix is in `docs/high-impact-smoke-matrix.md`. Live Clerk, Quran.com, AI, and Paddle sandbox checks require configured test credentials/services. |

### NEXT — Deliver continuity (2–8 weeks)

Run two sequenced waves. Wave A delivers the everyday core loop; Wave B adapts the shell and shared system after route/mental-model decisions are validated.

#### Wave A — One-action core journey (approximately weeks 2–6)

| ID | Work package | Owner(s) | Effort | Depends on / sequence |
| --- | --- | --- | --- | --- |
| X1 | Versioned mode-specific checkpoint model and reconciliation for read/listen/memorize/review | Backend + Frontend | L | N0/N1 patterns; data contract first |
| X2 | `NextAction` resolver with precedence, reason codes, fallback, and feature flag | Backend/Product + Data | M–L | X1 + N6; ship shadow mode before UI |
| X3 | Today `NextActionCard`, choose-another disclosure, quiet private history | Product Design + Frontend | M | X2 resolver; staged cohort |
| X4 | Reader header/settings sheet + persistent mini-player + exact resume | Frontend + Product Design + QA/A11y | L | X1, N4; visual/AT regression |
| X5 | Unified `CaptureSheet` for bookmark/reflection with linked-ayah round trip | Frontend + Product Design | M–L | S0 durability contract + X4 context |
| X6 | Simplified two-stage onboarding and direct first action; retire duplicate first-run guide | Product + Design + Frontend | L | X2 recommendation inputs |
| X7 | Continuity dashboards and moderated usability/accessibility sessions | Data + Research + QA/A11y | M, ongoing | N6; before Wave B expansion |

**Smallest end-to-end product slice — S1 Exact resume:** X1 → shadow X2 → X3 + the resume portion of X4. Limit the first cohort to reading/listening. Success means app open → one reasoned Resume → exact ayah/audio restoration → verified checkpoint → correct recommendation on return. Add Practice modes only after this loop meets restore reliability and usability gates.

#### Wave B — Adaptive shell and system foundations (approximately weeks 4–8)

| ID | Work package | Owner(s) | Effort | Depends on / sequence |
| --- | --- | --- | --- | --- |
| X8 | Validate five-destination IA; implement `AdaptiveNav` and More while preserving deep links | Product Design + Research + Frontend | L | X7 nav tasks; independent feature flag |
| X9 | Vertical Settings index and truthful setting persistence | Frontend + Product Design | M | N2 SaveStatus pattern |
| X10 | Shared recovery, source disclosure, semantic switches/segments, progress semantics | Design System + Frontend + QA/A11y | L | component API review; adopt in touched flows |
| X11 | RTL/localization migration for core journeys and native-language QA | Localization + Frontend + QA | L | X3–X6 copy/component stability |
| X12 | Performance budgets and route-level optimization for Today/reader/Practice/Journal | Frontend Platform + QA | M | stable screens; continuous measurements |

NEXT exit criteria: one-action loop passes field and moderated gates; reading/listening context restores reliably; capture round-trips to exact ayah; core shell uses five stable destinations; settings no longer horizontally hides categories; core journeys pass the accessibility/RTL matrix and Core Web Vitals budgets.

### LATER — Deepen practice and guidance (8–14+ weeks)

Only start broad exposure after NOW trust gates and NEXT instrumentation are stable.

| ID | Work package | Owner(s) | Effort | Depends on / sequence |
| --- | --- | --- | --- | --- |
| L1 | Mode-specific Practice shell, permission preflight, manual/self-grade fallback | Product Design + Frontend + QA/A11y | L | X1 checkpoint model |
| L2 | Granular recitation feedback with confidence, correction, replay, and recoverable uploads | ML/Backend + Frontend + Content Review | XL | L1; model/eval and privacy gates |
| L3 | Versioned review scheduling fed only by confirmed results | Backend + Data + Product | L | L1/L2 feedback contract |
| L4 | Canonical source results and reusable `SourceDisclosure` in reader/Ask Qur'an | Content Platform + Frontend | L | source policy/resolver |
| L5 | Opt-in cited AI synthesis, provider/privacy disclosure, report queue, useful fallback | AI/Backend + Security/Privacy + Content Review + Frontend | XL | L4 first; safety/evaluation gate |
| L6 | Journal account conflict resolution, export/import, and recovery center | Backend + Frontend + Security | L | S0 + field sync data |
| L7 | Validate gentle motivation and private history alternatives; no rank experiments | Research + Product + Content Review + Data | M | reliable outcome metrics |
| L8 | Retire legacy route/components and dark-mode bridge debt after adoption/regression proof | Design System + Frontend | L, incremental | X8/X10 stable; reversible until final cutover |

LATER exit criteria: Practice distinguishes system uncertainty from learner performance; feedback is inspectable and correctable; AI is optional, cited, reportable, and has a non-AI fallback; sync conflicts and exports protect private content; motivation remains descriptive and non-comparative.

## Delivery governance and definition of done

Each roadmap item is complete only when:

1. its happy, pending, empty, offline, permission-denied, error, recovery, and destructive states are designed and implemented where applicable;
2. data ownership/scope and migration/rollback behavior are documented;
3. instrumentation is payload-tested for privacy and visible in the relevant dashboard;
4. unit/integration coverage includes the state contract, and a browser test covers the highest-risk transition;
5. keyboard, screen reader, reflow, touch target, contrast, reduced motion, RTL, and localization checks are recorded for affected states;
6. user-facing errors are redacted and preserve effort;
7. content/religious review signs off any motivation, guidance, or AI wording;
8. product/design/engineering/QA agree that acceptance criteria are met under the feature flag before broader rollout.

### Recommended sequencing decision

Start with **S0 Trustworthy local capture**, not a visual shell overhaul. It fixes an observed data-integrity breach, supplies the shared save-state primitive needed by plans/checkpoints/bookmarks, and makes later behavior truthful. Then ship **S1 Exact resume** for reading/listening as the smallest complete expression of Hifzer's promise. Validate those two slices before expanding navigation, recitation intelligence, or AI.
