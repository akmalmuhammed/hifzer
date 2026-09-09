# Hifzer UI/UX audit — findings register

Date: 2026-09-04

Status: Complete within the documented access constraints

Scope: Current local runtime plus current repository code. No production code was changed.

[Executive report](README.md) · [evidence coverage](coverage.md) · [target experience](target-experience.md) · [roadmap](roadmap.md)

## How to read the evidence

- **Observed runtime** means the behavior was exercised in the current audit run and the named screenshot was opened and checked.
- **Code-confirmed** means the present implementation establishes the behavior or likely cause.
- **Inference** is a product consequence or likely user response that still needs analytics, production observation, or usability testing.
- **Blocked** means the local environment could not exercise the state because Clerk, database-backed identity, Quran Foundation credentials, Paddle, audio, or the AI gateway was unavailable.
- Comparator and standards research supports a recommendation; it is not evidence that Hifzer itself has a defect.

Priorities use **Critical**, **High**, **Medium**, and **Polish**. HF-00 is the only Critical item because ordinary use reproduced user-authored data disappearing after an explicit save confirmation. Accessibility statements are scoped risks or code-confirmed semantic/layout issues, not a claim of whole-product WCAG conformance.

## Research claim labels used below

- **RC-01 — One recommended next action.** A returning experience should foreground the next meaningful reading/review action, while leaving advanced choice available. Supported by [Quran.com product updates](https://quran.com/product-updates), [Duolingo's guided path rationale](https://blog.duolingo.com/new-duolingo-home-screen-design/), and [NN/g dashboard guidance](https://www.nngroup.com/articles/dashboards-preattentive/).
- **RC-02 — Preserve and resume context.** Resume should preserve a meaningful reading place and relevant mode/preferences. Supported by the [Quran Foundation reading-session API](https://api-docs.quran.com/docs/user_related_apis_versioned/1.0.0/add-or-update-user-reading-session/) and [Quran.com product updates](https://quran.com/product-updates).
- **RC-03 — Sacred-context trust.** Generated content must be clearly separated from canonical content, non-authoritative, and backed by resolvable citations, reporting, and appropriate review; motivation must not imply spiritual rank or use coercive devotional comparisons. Supported by [Quran Foundation Connected Apps v1.1](https://api-docs.quran.com/docs/connected-apps/) and the [Muslim Pro AiDeen source policy](https://support.muslimpro.com/help/en/articles/what-is-the-source-for-aideen-s-reply-is-it-verified).
- **RC-04 — Compact navigation.** Compact navigation should expose roughly three to five stable, labeled peers and move lower-frequency destinations into a truthful overflow/hub. Supported by [Apple tab-bar guidance](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [Android navigation patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns?hl=en), and [Android adaptive navigation](https://developer.android.com/develop/adaptive-apps/guides/build-adaptive-navigation).
- **RC-05 — Reflow, focus, language, and targets.** WCAG 2.2 AA includes 320 CSS-pixel reflow, focus not entirely obscured, programmatic language, status, and a 24×24 CSS-pixel target-size floor with exceptions. Hifzer should use the stricter 44–48 px ergonomic target for ordinary controls. Supported by [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum), [Apple button guidance](https://developer.apple.com/design/human-interface-guidelines/buttons), and [Android accessibility defaults](https://developer.android.com/develop/ui/compose/accessibility/api-defaults).
- **RC-06 — Directionality is semantic.** `lang` and `dir` are independent; Arabic and mixed-script content need correct language/direction, shaping, line height, wrapping, and bidi behavior. Supported by [W3C structural RTL guidance](https://www.w3.org/International/questions/qa-html-dir.en) and the [Arabic and Persian Layout Requirements draft](https://www.w3.org/TR/alreq/).
- **RC-07 — Local, recoverable errors.** Errors should be noticeable, understandable, near the action, input-preserving, and offer a credible next step. Supported by [NN/g form-error guidance](https://www.nngroup.com/articles/errors-forms-design-guidelines/), [NN/g usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/), and [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- **RC-08 — Status without focus theft.** Important asynchronous status should be visible and programmatically announced without moving focus. Supported by [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages) and [React optimistic/transition guidance](https://react.dev/reference/react/useOptimistic).

## Priority overview

| ID | Finding | Priority | Impact | Frequency | Confidence | Effort |
|---|---|---|---|---|---|---|
| HF-00 | Reload can delete a just-saved browser-only journal entry | Critical | Critical | High in local-journal mode | Very high | Small–medium |
| HF-01 | Reframe devotional rank badges as private milestones | High | High | Medium | High | Medium |
| HF-02 | Put the next Qur'an action ahead of aggregate progress | High | High | High | High | Medium |
| HF-03 | Repair compact-reader reflow and control collisions | High | High | High | High | Medium |
| HF-04 | Keep fixed mobile navigation from obscuring content/focus | High | High | High | High | Medium |
| HF-05 | Recover consistently from missing or expired authentication | High | High | Medium | High | Medium |
| HF-06 | Replace technical audio failures with user recovery | High | High | Medium | High | Small–medium |
| HF-07 | Make AI trust operational, not only presentational | High | High | Medium | High (code); runtime success blocked | Medium–large |
| HF-08 | Safeguard progress reset and dirty-draft discard | High | High | Low–medium | High | Small–medium |
| HF-09 | Simplify compact navigation and make “More” truthful | Medium | Medium–high | High | High | Medium |
| HF-10 | Give reader modes and toggles explicit control semantics | Medium | Medium | Medium–high | High | Medium |
| HF-11 | Replace the global ayah ID with user-language navigation | Medium | Medium | Medium | High | Small–medium |
| HF-12 | Complete the locale/RTL contract and Arabic semantics | High | High | Medium | High | Medium–large |
| HF-13 | Make settings categories discoverable and keyboard-complete | Medium | Medium | Medium | High | Small–medium |
| HF-14 | Remove the journal FAB collision during composition | Medium | Medium | Medium | High | Small |
| HF-15 | Raise dense reader controls to the product target size | Medium | Medium | High | High | Small–medium |
| HF-16 | One-time premium checkout does not grant paid entitlement | High | High | Every one-time purchase | High; checkout runtime blocked | Medium |
| HF-17 | Dashboard can remain stale for up to 10 minutes after progress mutations | High | High | High | High code confidence | Medium |
| HF-18 | “Private” journal copy does not define storage and encryption boundaries | High | High trust impact | Every journal user | High code / medium consequence | Medium–large |
| HF-19 | Core shell, disclosure, bookmark-sheet, status, and progress semantics are incomplete | High | High | High | High code / AT runtime untested | Medium |
| HF-20 | Analytics measures navigation, not core task completion and recovery | Medium | Medium–high | Continuous | High | Medium |
| HF-21 | Display account-save failures are silent behind a successful local state | High | Medium–high | On failure | High code / runtime failure untested | Small–medium |
| HF-22 | Invalid Qur'an IDs render in-route not-found content and likely return 200 | Medium | Medium | Low–medium | High code / HTTP status inferred | Small |

## Findings

### HF-00 — Reload can delete a just-saved browser-only journal entry

- **Priority / category:** Critical — data integrity, trust, journal continuity.
- **Affected workflow and users:** `/journal` when account-backed sync is unavailable; anyone writing a browser-only reflection, dua, or repentance note.
- **Evidence:** **Observed runtime:** `37-journal-note-saved-desktop.jpg` shows “Audit persistence probe” in the list plus the success toast “Note saved — This note is saved in this browser.” After a hard reload, `38-journal-note-lost-after-reload.jpg` shows “No notes yet.” **Code-confirmed:** local saves call `upsertJournalEntry` and then announce success (`src/app/(app)/journal/journal-client.tsx:523-549`); the entry is JSON in the owner-scoped localStorage key (`src/hifzer/journal/local-store.ts:78-88,431-440,466-500`). After the app shell's idle delay, `AppShellSideEffects` first renders `ProfileHydrator` with its initial `profile=null` while the snapshot fetch is still pending (`src/components/app/app-shell-side-effects.tsx:16-18,49-70,92-99`). `ProfileHydrator` immediately calls `syncLocalStateOwner(profile?.clerkUserId)` (`src/components/providers/profile-hydrator.tsx:21-27`); an absent ID clears all user-scoped browser data (`src/hifzer/local/store.ts:79-118,124-150,159-168`), including every `hifzer_private_journal_entries_v2:` key. The broader clear path is code-confirmed; only journal loss was runtime-confirmed.
- **Current behavior:** A temporary “profile not loaded yet” value is treated as an authoritative signed-out identity and runs the account-isolation purge.
- **User consequence:** A note can disappear immediately after Hifzer confirms it was saved. There is no in-product recovery, so the success message is materially false.
- **Likely cause:** Loading, signed-out, load-failed, and resolved-no-profile states all collapse to `null`.
- **Recommended change:** Introduce an explicit unresolved state and never synchronize/clear ownership until authentication is resolved. Clear scoped data only on a confirmed sign-out or confirmed account change, not during profile loading or a snapshot failure.
- **Implementation guidance:** Model `profile` as `undefined | null | ProfileSnapshot`; render/activate `ProfileHydrator` only after resolution, or pass an explicit `identityResolved` flag. Separate `syncLocalStateOwner` from `clearLocalStateOnConfirmedSignOut`. Preserve the current owner-isolation intent and add regression tests for delayed, failed, signed-out, signed-in, and account-switch transitions.
- **Research rationale:** Preserving user effort and telling the truth about system state are baseline user-control and visibility principles ([NN/g heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)); consequential stored-data operations also need prevention and recovery ([WCAG 2.2](https://www.w3.org/TR/WCAG22/)).
- **Expected impact / effort / confidence:** Critical integrity impact; small–medium effort; very high confidence.
- **Dependencies and risks:** Account isolation must not regress: an explicit sign-out/account switch still needs a verified purge. Already-deleted localStorage cannot be restored by this patch.
- **Acceptance criteria:** A locally saved note survives 20 hard reloads, delayed snapshot responses, and snapshot 500/offline failures; seeded journal/review/session/bookmark keys survive unresolved→same-user hydration; confirmed sign-out and A→B account switch clear A's scoped state; no success toast appears unless a post-save read confirms the entry; automated tests cover the full state matrix.
- **Success metric:** Zero reproduced post-save reload losses; 100% persistence-state regression pass rate; zero support reports of a note disappearing after “Note saved.”


### HF-01 — Reframe devotional “Khatmah rank” badges as private, non-ranking milestones

- **Priority / category:** High — trust, motivation, content ethics.
- **Affected workflow and users:** `/quran`; every reader, especially first-time readers and people sensitive to comparison or perceived spiritual status.
- **Evidence:** **Observed runtime:** screenshots `12-quran-home-progress-desktop.jpg`, `33-quran-rank-mobile-390.jpg`, and `34-quran-rank-badges-mobile-390.jpg` show “Khatmah rank,” “Talib Al-Qur'an,” “Seeker,” unlockable Khatmah I–XX badges, and “Ahl Al-Qur'an Path.” **Code-confirmed:** `src/app/(app)/quran/quran-completion-progress.tsx:20-63,180-218` defines spiritual-sounding tiers, an unlock ladder, a medal count, and “rank badges.”
- **Current behavior:** Completion counts are presented as a rank ladder with named status and locked future badges.
- **User consequence:** The product can appear to convert private worship into status, imply spiritual standing from app-tracked completion, or create pressure unrelated to the user's immediate Qur'an practice. That consequence is an inference, but the ranking language and visual hierarchy are directly observed.
- **Likely cause:** A generic gamification pattern was applied to a sacred context without a distinct devotional-motivation policy.
- **Recommended change:** Replace rank language with a private **Reading history** or **Khatmah milestones** module. Use neutral facts (“1 complete reading,” date range, personal reflection) rather than status titles, medals, locked spiritual labels, or comparison. Make the module collapsible/hideable and never public. Preserve a gentle celebration after completion, then return focus to the next reading action.
- **Implementation guidance:** Refactor the labels and tier model in `quran-completion-progress.tsx`; reuse `Card`, `Pill`, and the existing completion count, but remove `Medal`, rank count, locked badge grid, and spiritual-status titles. If milestones remain, store dates/history separately from rank. Add a product-content test preventing “rank,” “unlock,” and spiritual-status nomenclature in devotional metrics.
- **Research rationale:** RC-03; Quran Foundation's current connected-app guidance explicitly rejects spiritual rank and vanity-style devotional comparison. Headspace's [return-over-number framing](https://www.headspace.com/articles/building-a-meditation-practice) is a closer tonal analogue than loss-based gamification.
- **Expected impact / effort / confidence:** High trust impact; medium effort; high confidence in the mismatch, medium confidence in the best replacement until user research.
- **Dependencies and risks:** Marketing and retention stakeholders may fear losing motivation. Mitigate by testing private milestone reflection versus rank badges, not by removing acknowledgement entirely.
- **Acceptance criteria:** No user-facing Qur'an-completion surface uses “rank,” locked status, medal count, “Seeker,” “Maqam,” or “Ahl Al-Qur'an” as an earned app title; milestone history is explicitly private; completion celebration does not block continuing; no public/share/leaderboard path exists.
- **Success metric:** Qualitative trust score for the progress module; hide/dismiss rate; continue-reading rate after a completion milestone; zero support reports interpreting an app badge as religious standing.

### HF-02 — Put the next meaningful Qur'an action ahead of aggregate progress

- **Priority / category:** High — task entry, hierarchy, continuity.
- **Affected workflow and users:** `/quran`; returning and first-time readers.
- **Evidence:** **Observed runtime:** screenshot `12-quran-home-progress-desktop.jpg` gives most of the first viewport to a 0.0% ring, three aggregate stats, and rank content; screenshots `33`–`34` require a compact user to scroll through the same module before reaching the daily plan. A small “Continue reading” action exists, which is a strength, but it carries less visual weight than the aggregate card. **Code-confirmed:** `src/app/(app)/quran/page.tsx:71-102` renders a small top link, then `QuranCompletionProgress`, then the reading plan; `quran-completion-progress.tsx:117-226` repeats progress, rank, and a second Continue action.
- **Current behavior:** The page answers “How much of the whole Qur'an have I covered?” before fully answering “What should I do now?”
- **User consequence:** Returning users must parse a large progress surface before acting; at 0%, the page foregrounds deficit rather than a calm start. This likely increases time-to-reading and choice hesitation.
- **Likely cause:** Progress reporting, motivation, resume, and plan creation were combined into one visual priority stack.
- **Recommended change:** Lead with one **Continue from 1:1** or **Read today's portion** card containing place, estimated duration, and a single primary action. If a review is due, let the Today service choose that instead. Move aggregate coverage and milestones below the action; keep “Change plan,” browse, and history as secondary links.
- **Implementation guidance:** Reorder `src/app/(app)/quran/page.tsx`; extract a reusable `NextQuranActionCard` from the existing `trackedHref`, last ayah, and `QuranReadingPlanCard` computation. Keep `QuranCompletionProgress` but reduce it to a secondary disclosure. Use existing `Card`, `Pill`, and button primitives.
- **Research rationale:** RC-01 and RC-02. A recommended next action reduces choice paralysis while preserving advanced routes; the QF session model supplies a concrete resume place rather than a generic dashboard shortcut.
- **Expected impact / effort / confidence:** High impact, medium effort, high confidence in the hierarchy issue; the exact priority between due review and interrupted reading remains a product hypothesis.
- **Dependencies and risks:** Requires a deterministic priority rule across due Hifz review, current reading plan, and last interrupted reading. Do not silently force users into Hifz when they explicitly chose reading.
- **Acceptance criteria:** At desktop and 390/320 CSS px, one primary next action with specific context appears before aggregate metrics; it opens the intended session in one activation; secondary metrics remain reachable; the chosen action and why it was chosen are deterministic and unit-tested.
- **Success metric:** Median/p75 time from `/quran` load to reader start; primary CTA start rate; backtrack rate; resume accuracy for ayah, mode, translation, reciter, and audio position.

### HF-03 — Repair compact-reader reflow and control collisions

- **Priority / category:** High — responsive layout, readability, accessibility.
- **Affected workflow and users:** `/quran/read`; compact mobile users at 320–390 CSS px, users zooming text, and potentially longer localized labels.
- **Evidence:** **Observed runtime:** `20-reader-controls-mobile-390.jpg` shows anonymous/bookmark help colliding with the resize instruction; `36-reader-reflow-320-overlap.jpg` shows the instruction, anonymous help, and A−/A+ controls crossing the same vertical space. `22-reader-tablet-768.jpg` still shows the fixed nav layered over the reader toolbar region. **Code-confirmed:** `src/app/(app)/quran/read/compact-reader-client.tsx:281-333` combines the expanding audio player, journal/bookmark actions, a long instruction, and A−/A+ in adjacent flex rows; `src/components/audio/ayah-audio-player.tsx:515-601` uses fixed progress widths and truncates source detail.
- **Current behavior:** Controls technically wrap, but independent content blocks do not reserve space for one another, so instructional and anonymous-state copy overlap at narrow widths.
- **User consequence:** Core reading controls become harder to read and may obscure meaning or state. Users with low vision, larger text, or long translations face the highest risk.
- **Likely cause:** The compact layout relies on generic `flex-wrap` and fixed-width subcontrols rather than a deliberate narrow reader-toolbar composition.
- **Recommended change:** At compact widths, stack three explicit rows: (1) audio play/status, (2) repeat/speed/auto and ayah actions, (3) text-size controls. Replace the long gesture instruction with a short labeled “Text size” group; move anonymous bookmark explanation into the disabled bookmark's help/popover. Permit source status to wrap to two lines or open a details disclosure rather than collide/truncate.
- **Implementation guidance:** Add a reader-toolbar layout primitive in `compact-reader-client.tsx` and responsive classes/CSS for `AyahAudioPlayer`; avoid absolute positioning; test English, Urdu, Persian, and maximum browser text size. Keep the current player/state logic.
- **Research rationale:** RC-05 and RC-07; reflow must work at 320 CSS px without two-dimensional scrolling or overlapping meaningful content.
- **Expected impact / effort / confidence:** High impact, medium effort, high confidence.
- **Dependencies and risks:** Audio controls have several live states; changes must cover idle, resolving, playing, unavailable, and local/remote fallback. Do not hide an actionable failure in truncation.
- **Acceptance criteria:** No text/control collision or horizontal document overflow at 320, 390, and 768 CSS px in all player states, at 200% text resize, and in Urdu/Persian direction; all controls remain keyboard reachable and visible; screenshot regression tests cover the three target widths.
- **Success metric:** Responsive visual-regression pass rate; reader control task success; rate of repeated taps on player/text-size controls; compact-session abandonment before the first ayah.

### HF-04 — Keep fixed mobile navigation from obscuring content and focused controls

- **Priority / category:** High — global shell, responsive behavior, keyboard access.
- **Affected workflow and users:** Every app route below 768 px, especially reader and settings; keyboard/switch users and people using browser zoom.
- **Evidence:** **Observed runtime:** the fixed six-item bar overlays reader/settings content in screenshots `18`–`22`, `32`, `34`, and `36`; on `19-reader-settings-mobile-390.jpg` it covers the expanded settings while scrolling; at tablet height in screenshot `22` it crosses the reader toolbar. **Code-confirmed:** `src/components/app/app-shell.tsx:340-371` renders the mobile nav as `position: fixed` with z-index 40; `src/components/app/app-shell.module.css:56-64,81-83` adds a static 7rem bottom pad only below 768 px and positions the bar above the safe-area inset.
- **Current behavior:** The shell reserves end-of-document space but the nav still covers content passing beneath it and can cover a focused target in the viewport.
- **User consequence:** Text and controls become temporarily unreadable or hard to activate; a focused control can be obscured by persistent chrome.
- **Likely cause:** Fixed visual chrome was treated as an overlay rather than as part of the scroll/focus layout contract.
- **Recommended change:** Reserve the measured nav block plus safe area in every scroll container, add `scroll-padding-block-end`, and ensure focused elements use `scroll-margin-block-end`. In immersive reader mode, consider a collapsible/minimized nav after downward scroll with a stable way to restore it; do not rely on auto-hide for accessibility.
- **Implementation guidance:** Centralize `--kw-mobile-nav-block-size` in `globals.css`; use it in `app-shell.module.css`, reader scrollers, and journal/settings layouts. Add a focus-in handler only if CSS scroll padding is insufficient. Verify the installed-PWA safe-area case.
- **Research rationale:** RC-05; WCAG 2.2's focus-not-obscured requirement and adaptive navigation guidance apply to the complete responsive process.
- **Expected impact / effort / confidence:** High cross-route impact, medium effort, high confidence.
- **Dependencies and risks:** A taller reserved inset reduces usable viewport height. Prefer exact measurement and component-level insets over an oversized blanket margin.
- **Acceptance criteria:** At 320/390/768 CSS px and 200% text resize, no focused control is entirely hidden by the nav; the final content/action can scroll fully above it; safe-area insets work in standalone PWA mode; automated focus traversal asserts visible bounding rectangles.
- **Success metric:** Zero nav-overlap visual regressions; compact task-completion rate; focus-obscured defects in accessibility QA; navigation-related rage/repeated taps.

### HF-05 — Recover consistently from missing or expired authentication

- **Priority / category:** High — access, error recovery, development readiness.
- **Affected workflow and users:** Sign-in/sign-up, `/dashboard`, `/hifz`, `/worship`, and other account-backed routes; signed-out, expired-session, and local-development users.
- **Evidence:** **Observed runtime:** screenshots `05` and `06` show an honest auth-unavailable page with a useful reader preview; `25-dashboard-auth-error-desktop.jpg` interprets Unauthorized and offers Try again, Open Qur'an, and Help. In contrast, `24-hifz-unauthorized-desktop.jpg` and `29-worship-unauthorized-desktop.jpg` expose “Unauthorized” with only Retry. **Code-confirmed:** `src/app/(app)/dashboard/dashboard-client.tsx:832-859` maps 401 to recovery copy; `src/app/(app)/session/session-client.tsx:1040-1055` and `src/app/(app)/worship/worship-client.tsx:81-110,220-228` surface API error strings. In nonproduction with Clerk absent, `src/proxy.ts:76-95` deliberately allows protected routes, while `src/app/(app)/layout.tsx:28-64` does not establish a user, so protected clients call APIs that return 401.
- **Current behavior:** Recovery quality varies by route; the local app shell appears usable even when account-backed actions cannot succeed.
- **User consequence:** Users cannot tell whether Retry can work, how to reauthenticate, or which parts remain usable. Developers can misread auth noise as feature failure.
- **Likely cause:** 401 handling is implemented per feature rather than through a shared auth/session boundary; nonproduction preview mode is implicit.
- **Recommended change:** Introduce a shared `SessionRecoveryState` that distinguishes **session expired**, **account service unavailable**, and **guest preview**. For expired sessions, offer Sign in and preserve the exact safe return URL. When Clerk is absent locally, either route protected pages to the explicit auth-unavailable screen or intentionally enter a labeled preview mode that suppresses protected API calls. Keep the dashboard's “Open Qur'an” fallback.
- **Implementation guidance:** Reuse `EmptyState` and `Button`; add a typed API/auth error mapper and use it in dashboard, session, worship, journal, settings, and assistant. Align `proxy.ts` and app layout around a single nonproduction preview contract.
- **Research rationale:** RC-07 and the product's own stronger dashboard/auth fallback patterns.
- **Expected impact / effort / confidence:** High impact; medium effort; high confidence in inconsistency. Production frequency is unknown because production auth was blocked.
- **Dependencies and risks:** Preserve fail-closed production behavior in `proxy.ts`; never turn local test bypass into a deployable auth bypass. Return URLs must stay restricted to safe internal paths.
- **Acceptance criteria:** No end-user route renders raw “Unauthorized”; 401 states expose Sign in with a safe return path and a viable non-account fallback where appropriate; Retry is shown only when it can change the outcome; Clerk-disabled local mode is explicit and documented; tests cover expired, absent, and restored sessions.
- **Success metric:** 401 recovery-to-sign-in completion; repeated futile retries; support contacts tagged session/auth; local setup time to first valid core flow.

### HF-06 — Replace technical audio/config failures with user-facing recovery

- **Priority / category:** High — error copy, trust, core-reader recovery.
- **Affected workflow and users:** `/quran/read`; anyone attempting audio when local media or Quran Foundation audio is unavailable.
- **Evidence:** **Observed runtime:** `10-reader-audio-unavailable-desktop.jpg` shows “Set QF_CONTENT_CLIENT_ID and QF_CONTENT_CLIENT_SECRET…” inside the reader and truncates the rest; `20` and `36` show the same status competing for compact space. **Code-confirmed:** `src/hifzer/quran-foundation/content.ts:865-879` returns the environment-variable instruction as the public `detail`; `src/components/audio/ayah-audio-player.tsx:187-206,590-596` puts the returned detail directly in the UI and truncates it.
- **Current behavior:** Internal deployment vocabulary is exposed to end users, while the player offers no change-reciter/read-without-audio path in the failure surface.
- **User consequence:** The message cannot be acted on by a normal reader, weakens trust, and hides the important fact that text reading remains available. It also gives developers no structured public/private error separation.
- **Likely cause:** A diagnostic string is shared across server logs and product copy.
- **Recommended change:** Return a typed public audio status (`not_configured`, `temporarily_unavailable`, `not_found`, `offline`) plus an internal diagnostic code. Render plain copy: “Audio isn't available right now. You can keep reading, try again, or choose another reciter.” Keep environment names in server logs/Sentry only.
- **Implementation guidance:** Split `detail` into `userMessage`/`diagnosticCode` in the audio API contract, map errors in `ayah-audio-player.tsx`, add Retry and Reciter actions where applicable, and announce a changed state politely. Preserve local fallback behavior.
- **Research rationale:** RC-07 and RC-08.
- **Expected impact / effort / confidence:** High trust/recovery impact; small–medium effort; high confidence.
- **Dependencies and risks:** Avoid retry storms; the alternative-reciter action must know whether any catalog is available. Do not claim Quran.com is down when only deployment configuration is missing.
- **Acceptance criteria:** No client-visible string contains environment-variable names or stack/HTTP details; every audio failure has a plain explanation and at least one viable next action; text reading remains fully available; status is announced without focus theft; all failure codes are covered by tests.
- **Success metric:** Audio failure recovery rate; successful reciter fallback; repeated play taps after a terminal error; error-code distribution by deployment.

### HF-07 — Make AI trust operational, not only presentational

- **Priority / category:** High — AI trust, provenance, recovery.
- **Affected workflow and users:** Per-ayah Explain and `/assistant` Ask Qur'an; all users, with elevated risk for people seeking religious guidance.
- **Evidence:** **Observed runtime:** `04-landing-guidance-desktop.jpg` is a strength: it clearly labels a stored sample, keeps ayah/source context visible, and states that guidance does not replace a scholar. But actual runtime failures in `11-reader-ai-unavailable-desktop.jpg` and `31-ask-quran-unavailable-desktop.jpg` say only that the deployment is not configured; Explain offers only Try again, and Ask offers no recovery action. **Code-confirmed:** `src/components/quran/ayah-ai-explanation-panel.tsx:101-163` renders source names but no resolvable links, limitations, or report control; `quran-ai-assistant-panel.tsx:168-247` renders source labels as `Pill`s. `src/hifzer/ai/contracts.ts:14-17` gives explanation sources only `label` and `kind`, so a resolvable citation is impossible in that response contract. **Blocked:** a successful live AI answer could not be exercised because the gateway is not configured; correctness and citation destination quality remain unverified.
- **Current behavior:** The marketing demo communicates trust better than the live component contract. Live success UI can name sources, but not open them; live failure surfaces do not route users to canonical translation/tafsir or a report/limitations path.
- **User consequence:** Users may over-trust an attractive generated summary or be stranded when AI fails. A named source without a resolvable location is difficult to verify.
- **Likely cause:** Grounding was designed into generation, but verification, reporting, and failure fallback were not treated as first-class UI states.
- **Recommended change:** Keep AI explicitly opt-in and visually subordinate. Extend every claim/source to a stable verse/resource ID and URL; make citations open the relevant ayah/tafsir context. Add “AI-generated study aid,” limitations, report-feedback, and qualified-scholar language beside live output. On failure, offer **Open translation and tafsir** rather than only Retry.
- **Implementation guidance:** Extend `AyahExplanationSource` with `sourceId`, `verseKey`/resource ID, and validated `url`; render an accessible citation list in both AI panels; add a report endpoint/control with the response ID and source context; preserve provider/model only in diagnostics. Reuse `SupportTextPanel`, current `Open` links, and journal prefill, but label generated reflections when saved.
- **Research rationale:** RC-03; Quran Foundation Connected Apps is directly applicable because Hifzer uses Quran Foundation content and a Quran MCP grounding path.
- **Expected impact / effort / confidence:** High trust impact; medium–large effort; high code confidence, medium end-to-end confidence until a configured gateway is tested.
- **Dependencies and risks:** Source URLs must be allowlisted/validated; report handling needs privacy rules; scholar language must not imply live scholarly review where none exists. Grounded retrieval does not guarantee interpretive correctness.
- **Acceptance criteria:** Every live answer is labeled AI-generated and non-authoritative; every displayed source resolves to an exact in-product or official location; a report control captures answer/source IDs; failure always offers canonical content; saved AI reflections retain an origin label; configured-environment QA validates success, timeout, no-match, unsafe-topic, and provider-failure states.
- **Success metric:** Citation-open rate; report rate and resolution; AI retry/abandon rate; canonical-fallback use after failure; sampled citation-validity and claim-support rate.

### HF-08 — Safeguard one-click progress reset and dirty-draft discard

- **Priority / category:** High — user control, destructive actions, data loss prevention.
- **Affected workflow and users:** Guided dua module progress and journal composition.
- **Evidence:** **Observed runtime:** `27-dua-guided-module-desktop.jpg` puts “Reset progress” in the top action row; `28-journal-editor-overlap-desktop.jpg` shows a prominent red “Discard” beside Pin. **Code-confirmed:** `src/app/(app)/dua/dua-experience-client.tsx:647-654,1215-1217` resets current module progress immediately with no confirmation/undo. `src/app/(app)/journal/journal-client.tsx:892-903,1221-1224` drops an unsaved new draft immediately when Discard is pressed, also without confirmation/undo; no dirty-state check is used in that handler.
- **Current behavior:** Two user-created/progress states can be erased with one activation, and the visual treatment gives destructive actions high prominence.
- **User consequence:** A mis-tap or keyboard activation can remove meaningful effort; the risk is especially inappropriate for private reflections.
- **Likely cause:** Destructive controls reuse direct state-reset handlers without a shared confirmation/undo policy.
- **Recommended change:** For dirty journal drafts, ask a concise confirmation or provide a short-lived Undo that restores the entire draft. For dua progress, confirm with explicit scope (“Reset 4 visited steps in Repentance?”) and keep Cancel focused by default. De-emphasize destructive actions until the user opens an overflow or secondary action area.
- **Implementation guidance:** Add a reusable confirmation-dialog primitive with focus trap/return, Escape handling, and destructive labeling; alternatively stage deletion in memory and use the existing toast for Undo. Unit-test state restoration and confirm that synced data is not deleted until commit.
- **Research rationale:** RC-07 and NN/g's user-control/error-prevention heuristics; WCAG 2.2 also requires reversible, checked, or confirmed submission for certain consequential stored-data changes.
- **Expected impact / effort / confidence:** High prevention impact; small–medium effort; high confidence.
- **Dependencies and risks:** Avoid confirmation fatigue: no dialog is needed for an empty untouched draft. Undo duration must not be the only recovery for assistive-technology users.
- **Acceptance criteria:** Dirty draft discard and non-zero progress reset are reversible or explicitly confirmed; dialogs have an accessible name, initial safe focus, focus return, and keyboard support; empty untouched drafts can close directly; tests cover synced/local draft and progress restoration.
- **Success metric:** Undo usage; confirmed-cancel rate; support reports of lost notes/progress; accidental reset/discard events per 1,000 sessions.

### HF-09 — Simplify compact navigation and make “More” truthful

- **Priority / category:** Medium — information architecture, navigation.
- **Affected workflow and users:** All mobile app users.
- **Evidence:** **Observed runtime:** screenshots `18`–`22`, `32`–`34`, and `36` show six compressed bottom destinations: Today, Qur'an, Hifz, Dua, Trackers, More. Journal, Ask Qur'an, Help, and Roadmap are absent even though they are desktop destinations. **Code-confirmed:** `src/components/app/app-shell.tsx:46-71` defines ten desktop destinations across primary/learn/help groups but six mobile items; “More” links directly to `/settings`, not a hub.
- **Current behavior:** Compact navigation exceeds the common three-to-five peer pattern; “More” is a misleading alias for Settings and does not recover destinations removed from mobile.
- **User consequence:** Labels and tap regions are crowded, feature location differs by device, and a user looking for Journal or Help has no obvious compact path.
- **Likely cause:** The mobile bar was assembled by selecting individual desktop routes instead of modeling task-level destinations and an overflow hierarchy.
- **Recommended change:** Use five destinations as the starting hypothesis: **Today, Qur'an, Practice, Journal, More**. Practice can open a choice/resume surface for Hifz and guided dua; More becomes an actual hub for Dua (if not in Practice), Trackers, Ask Qur'an, Help, Settings, Roadmap, and account. Validate the Practice grouping before release; if Dua is a top-five job, keep it and move Journal into a visible More hub.
- **Implementation guidance:** Replace `MOBILE_NAV` with task-level destinations; build `/more` or a mobile sheet using the same nav item metadata as the desktop shell so routes cannot drift. Preserve route state and announce the current destination.
- **Research rationale:** RC-04. This is structural guidance, not a request to copy Apple/Android visual styling.
- **Expected impact / effort / confidence:** Medium–high findability impact; medium effort; high confidence in the “More” mismatch, medium confidence in the exact five-item grouping without analytics.
- **Dependencies and risks:** Route grouping needs event data and five-task usability testing. Do not bury a high-frequency Dua or Hifz action based only on platform guidance.
- **Acceptance criteria:** Compact nav has no more than five stable destinations; every desktop top-level route is reachable from a labeled compact path; More opens a genuine hub/overflow; labels do not change meaning across widths; task tests cover Today→read, Hifz start, Dua start, Journal open, and Settings/Help discovery.
- **Success metric:** Mobile route-finding success/time; wrong-route/backtrack rate; usage of More by destination; nav-label comprehension.

### HF-10 — Give reader modes and toggles explicit control semantics

- **Priority / category:** Medium — interaction clarity, consistency, accessibility semantics.
- **Affected workflow and users:** Expanded settings in `/quran/read`; especially first-time, keyboard, and screen-reader users.
- **Evidence:** **Observed runtime:** screenshots `08-reader-settings-desktop.jpg` and `19-reader-settings-mobile-390.jpg` show a visually uniform chip cloud containing current states (“Tracking on,” “Anonymous window,” “Compact view”) and actions (“Disable phonetics,” “Disable translation”). Several chips appear similarly selected even though some are mutually exclusive and others are commands. **Code-confirmed:** `src/app/(app)/quran/read/page.tsx:376-450` implements all of them as styled links with selection encoded only by styling and URL state; the corresponding labels are in `src/hifzer/quran/reader-ui-copy.ts:74-95`.
- **Current behavior:** Mode choice, view choice, visibility toggles, and current-state indicators share one visual/control pattern.
- **User consequence:** Users must infer whether tapping a chip selects a value, navigates, or turns an existing feature off; assistive technology does not receive radio/switch state from these links.
- **Likely cause:** URL-driven settings were rendered through a reusable pill-link pattern without a semantic control model.
- **Recommended change:** Group controls explicitly: **Privacy** (Tracked / Anonymous radio group), **Layout** (List / One ayah segmented radio), and switches for Translation, Transliteration, and Tafsir with positive labels and visible on/off state. Keep persistence/account explanation under the relevant group.
- **Implementation guidance:** Use GET-backed forms or router updates but render real `radio`/`switch` semantics (`aria-checked` only with an appropriate role), fieldset/legend labels, and a shared segmented-control primitive. Preserve the existing URL contract for shareable/deep links.
- **Research rationale:** RC-07 plus NN/g consistency and match-to-user-language heuristics.
- **Expected impact / effort / confidence:** Medium clarity impact; medium effort; high confidence.
- **Dependencies and risks:** Route updates can reset scroll/focus; use transitions and restore focus to the changed control. “Tracking” must explain which data is stored and where.
- **Acceptance criteria:** Each control has one clear semantic role; mutually exclusive choices expose a single selected value; visibility controls use positive labels and programmatic state; state is not conveyed by color alone; URL/back/forward behavior and focus are preserved; labels are localized.
- **Success metric:** Setting-change success and reversal rate; time to enable/disable translation; reader-settings abandonment; accessibility-tree test pass rate.

### HF-11 — Replace the global ayah ID with user-language navigation and inline errors

- **Priority / category:** Medium — form design, navigation, validation.
- **Affected workflow and users:** `/quran/read` settings; people jumping to a known verse.
- **Evidence:** **Observed runtime:** screenshot `09-reader-filter-validation-desktop.jpg` shows “Ayah (global id)” with `99999` and a browser bubble: “Value must be less than or equal to 6236.” It explains a database-like bound but not how to enter a familiar verse reference. **Code-confirmed:** `src/app/(app)/quran/read/page.tsx:202-212,480-490` parses and exposes a global 1–6236 ID; validation relies on native `min`/`max`. A more user-centered Surah quick jump already exists at `src/app/(app)/quran/page.tsx:158-188` and can be reused.
- **Current behavior:** The form asks for an internal corpus index rather than surah/ayah language and delegates recovery copy to the browser.
- **User consequence:** A reader who knows 2:255 cannot reliably map it to a global ID; errors are transient/browser-dependent and do not propose the valid reference format.
- **Likely cause:** The storage/query key leaked into the navigation interface.
- **Recommended change:** Ask for **Surah** and **Ayah in this surah**, or accept a single reference such as `2:255`, name search, or Juz. Keep global ID only in an Advanced/debug surface. Show a persistent inline error such as “Al-Fatihah has 7 ayahs; enter 1–7,” preserve input, and focus the error summary only when submission needs it.
- **Implementation guidance:** Reuse `listSurahs`, `SurahSearchSelect`, and lookup helpers; derive the per-surah maximum; add `aria-describedby`, `aria-invalid`, and a programmatic error message. Retain current URL translation to `cursor` internally.
- **Research rationale:** RC-07 and [NN/g filter vocabulary guidance](https://www.nngroup.com/articles/filter-categories-values/).
- **Expected impact / effort / confidence:** Medium navigation impact; small–medium effort; high confidence.
- **Dependencies and risks:** Name search must handle transliterations/localized names; avoid auto-correcting a reference to the wrong surah. Browser-native validation can remain as a backstop, not the only message.
- **Acceptance criteria:** Users can enter `surah:ayah` or select Surah + Ayah without knowing global IDs; invalid input gets persistent, local, specific guidance; values survive failure; keyboard and screen-reader error announcement are verified; URL deep links remain backward compatible.
- **Success metric:** Jump success rate; validation error/retry rate; time to reach a requested verse; search/reference abandonment.

### HF-12 — Complete the locale/RTL contract and Arabic semantics

- **Priority / category:** High — localization, directionality, assistive-technology robustness.
- **Affected workflow and users:** Urdu and Persian interface users; screen-reader users; all surfaces containing Arabic Qur'an/dua text.
- **Evidence:** **Observed runtime:** `23-landing-urdu-rtl-desktop.jpg` shows the shell mirrored and “Sign in” translated, while navigation labels, hero, CTAs, and body remain English. **Code-confirmed:** `src/components/providers/ui-language-provider.tsx:39-45,74-83` changes the whole document to Urdu/Persian `lang` and RTL. Yet `src/components/landing/marketing-nav.tsx:15-30` hardcodes story links, CTA, and tagline in English, and most `landing-page.tsx` content is hardcoded English. Qur'an/dua Arabic runs often set only `dir="rtl"` without `lang="ar"`, including `src/app/(app)/quran/read/compact-reader-client.tsx:348-360`, `quran-ai-assistant-panel.tsx:209-224`, and `dua-experience-client.tsx:1334-1361`.
- **Current behavior:** Selecting an interface language changes the document's language/direction before all visible strings are translated; Arabic content direction is usually correct, but its language is not always programmatically identified.
- **User consequence:** English may be pronounced using an Urdu/Persian voice, reading order can be confusing, and Arabic may be announced with the wrong language. The selector promises broader localization than the content delivers.
- **Likely cause:** Translation coverage is limited to shell dictionaries while `html lang/dir` is global; content-run semantics were applied inconsistently.
- **Recommended change:** Treat locale as a complete contract. Short term: keep document `lang="en"` on mostly English pages, mark localized fragments with their own `lang`/`dir`, and label the control honestly if it changes only shell/translation. Target state: move landing and app strings into locale resources, then switch document language/direction only when the visible interface is translated. Add `lang="ar" dir="rtl"` to every Arabic run and bidi isolation around verse refs/numbers.
- **Implementation guidance:** Expand `app-ui-copy.ts` or adopt a route-level message catalog; create an `ArabicText` primitive that enforces `lang="ar"`, `dir="rtl"`, font, and line-height; add lint/tests for Arabic literals without semantic language. Prefer logical CSS properties.
- **Research rationale:** RC-06 and WCAG 2.2 language-of-parts requirements. ALREQ is expert layout guidance, not a complete Qur'anic orthography specification.
- **Expected impact / effort / confidence:** High accessibility/trust impact; medium–large effort for full translation, small effort for semantic containment; high confidence.
- **Dependencies and risks:** Requires qualified Urdu/Persian translation review and Qur'anic typography review. Machine-translating religious interface copy without review would introduce a greater trust risk.
- **Acceptance criteria:** No predominantly English page declares Urdu/Persian as its document language; all visible interface strings in a declared locale are reviewed translations or explicitly language-tagged exceptions; all Arabic content runs use `lang="ar" dir="rtl"`; mixed verse numbers/source labels remain ordered at 320 px; Urdu/Persian keyboard and screen-reader smoke tests pass.
- **Success metric:** Locale-specific task success; untranslated-string count; screen-reader language-switch defects; RTL visual-regression pass rate.

### HF-13 — Make settings categories discoverable and keyboard-complete

- **Priority / category:** Medium — settings IA, responsive behavior, keyboard semantics.
- **Affected workflow and users:** `/settings` on compact screens and keyboard/screen-reader users.
- **Evidence:** **Observed runtime:** `32-settings-mobile-390.jpg` shows only Learning and part of Display with a horizontal scrollbar; Account and Integrations are offscreen without a strong continuation cue. **Code-confirmed:** `src/app/(app)/settings/settings-hub.tsx:145-177` uses four 190px-wide horizontally scrolling items with `role="tab"`; it has no ArrowLeft/ArrowRight/Home/End handling or roving `tabIndex`, though it declares tablist semantics.
- **Current behavior:** Categories look like large cards in an overflow strip; keyboard users must Tab through every category rather than use expected tablist arrow keys.
- **User consequence:** Users may not discover account/integration settings; semantic expectations and interaction behavior diverge.
- **Likely cause:** A desktop card treatment was reused as a mobile tablist without a compact navigation state machine.
- **Recommended change:** On mobile, use a compact segmented/dropdown category control or smaller scroll-snap tabs with a clear edge cue and current-position indication. If retaining `role="tablist"`, implement roving focus and Arrow/Home/End keys; otherwise use ordinary buttons/navigation without tab semantics. Consider storing the category in the URL for refresh/back/deep-link stability.
- **Implementation guidance:** Update `settings-hub.tsx`; reuse `Pill` inside the panel rather than inside every category tab. Add keyboard unit tests and 320/390 visual tests. Do not make category cards horizontally draggable-only.
- **Research rationale:** RC-04, RC-05, and WCAG keyboard/focus principles.
- **Expected impact / effort / confidence:** Medium impact; small–medium effort; high confidence.
- **Dependencies and risks:** URL state changes must not cause full-page scroll reset. If categories become routes, preserve existing settings detail URLs.
- **Acceptance criteria:** All four categories are discoverable at 320/390 px; the selected category is visible and persistent; tablist semantics include Arrow/Home/End and one tab stop, or roles are removed; focus and panel labeling are correct; no horizontal page overflow.
- **Success metric:** Settings-category discovery success; Account/Quran.com settings find time; keyboard test pass rate; backtrack rate.

### HF-14 — Remove the journal new-note FAB collision during composition

- **Priority / category:** Medium — layout, composition flow, action hierarchy.
- **Affected workflow and users:** `/journal` while composing/editing a note.
- **Evidence:** **Observed runtime:** `28-journal-editor-overlap-desktop.jpg` shows the fixed yellow plus button covering the right side of the tag composer and “Add tag” action. **Code-confirmed:** `src/app/(app)/journal/journal-client.tsx:1371-1404,1575-1578` renders both the tag row and the global new-note button; `src/app/(app)/journal/journal.module.css:442-468` fixes the FAB 28px from the viewport edges with z-index 30, regardless of editor state.
- **Current behavior:** The global create action remains above the active editor even though the user is already creating a new note.
- **User consequence:** A primary editing control is partially obscured, and the plus action can accidentally replace/switch the current draft.
- **Likely cause:** FAB visibility is not tied to `draft`/expanded-editor state and does not account for the editor's action region.
- **Recommended change:** Hide the FAB while any note is expanded, or convert it to a non-overlay action in the journal header/list state. If it must remain, dock it inside reserved layout space and change it to “New note” only after the current draft is safely persisted.
- **Implementation guidance:** Conditionally render the FAB only when `draft === null`; keep `maybePersistBeforeSwitch` as defense in depth. Add a stacking/overlap regression assertion for the tag composer and save row at desktop/mobile widths.
- **Research rationale:** RC-05 and NN/g error prevention/minimalism.
- **Expected impact / effort / confidence:** Medium impact; small effort; high confidence.
- **Dependencies and risks:** Users still need an obvious way to start another note after saving; expose the action immediately in list state rather than relying on a hidden shortcut.
- **Acceptance criteria:** No global create control overlaps editor fields/actions at 320–1440 px; the FAB is absent or safely docked during composition; starting another note cannot silently replace a dirty draft; keyboard focus order excludes hidden controls.
- **Success metric:** Tag-add completion; accidental new-note activations while editing; overlap visual-regression defects.

### HF-15 — Raise dense reader controls to the product target size

- **Priority / category:** Medium — touch ergonomics, accessibility.
- **Affected workflow and users:** `/quran/read` on touch screens; users with motor or low-vision needs.
- **Evidence:** **Observed runtime:** `20-reader-controls-mobile-390.jpg` and `36-reader-reflow-320-overlap.jpg` show tightly packed play/repeat/speed/auto/journal/bookmark controls. **Code-confirmed:** the play target is 32×32 px on compact screens and 36×36 px at `src/components/audio/ayah-audio-player.tsx:517-526`; repeat/speed controls use `text-[11px] px-2 py-1.5` at `:601-648`. By contrast, shared medium buttons already use the 44px token at `src/components/ui/button.tsx:30-38` and `src/app/globals.css:107-112`.
- **Current behavior:** Custom high-frequency reader controls bypass the design-system control heights in the densest touch surface.
- **User consequence:** Controls are more difficult to hit accurately, particularly while holding a phone or during repetitive listening. The 32px control is above the WCAG 24px floor but below Hifzer's appropriate 44–48px product target.
- **Likely cause:** Space pressure in the combined audio toolbar led to one-off compact dimensions.
- **Recommended change:** Give every ordinary reader action a minimum 44×44 CSS-pixel hit region, while keeping icons visually compact. Add spacing so 24px fallback exceptions are never needed in the core toolbar. Preserve visible pressed/disabled/focus states and label icon-only actions.
- **Implementation guidance:** Reuse `--kw-control-md-height` or add `--kw-touch-target-min: 2.75rem`; wrap small art in larger hit boxes; update player and reader icon-action primitives rather than patching individual buttons. Coordinate with HF-03 so larger targets do not recreate collisions.
- **Research rationale:** RC-05. The 44–48 px value is an ergonomic product target from Apple/Android guidance, not a claim that WCAG itself requires 44px.
- **Expected impact / effort / confidence:** Medium ergonomic impact; small–medium effort; high confidence.
- **Dependencies and risks:** Larger targets require the stacked layout in HF-03. Do not shrink Arabic text or hide functionality to recover space.
- **Acceptance criteria:** All primary reader touch targets measure at least 44×44 CSS px or have an equivalent non-overlapping hit area; spacing prevents adjacent-target ambiguity; focus, pressed, disabled, and loading states remain visible; automated geometry tests cover 320/390 px.
- **Success metric:** Mis-tap/repeated-tap rate; successful play/repeat/font-size changes on first tap; target-size audit pass rate.

### HF-16 — One-time premium checkout does not grant paid entitlement

- **Priority / category:** High — checkout, entitlement, promise integrity.
- **Affected workflow and users:** `/billing/upgrade`, `/support`, Paddle checkout, and `/billing/thank-you`; every paying user.
- **Evidence:** **Code-confirmed:** the UI repeatedly promises one-time premium with no subscription (`src/components/billing/support-checkout-card.tsx:11-47,230-263`; `src/app/(app)/billing/upgrade/page.tsx:24-29,45-50,80-89`). Checkout creates an inline one-time transaction with `clerk_user_id` and no billing cycle (`src/app/api/paddle/checkout/route.ts:59-87`). In `transaction.completed`, the webhook sets `plan="PAID"` only inside `if (data.subscriptionId)` (`src/app/api/paddle/webhook/route.ts:107-135`), while the one-time offer explicitly creates no subscription. The thank-you page nevertheless says the payment succeeded (`src/app/(app)/billing/thank-you/page.tsx:23-38`). **Blocked:** no configured Paddle payment/webhook was executed. Paddle's official one-time-product flow says it skips the subscription engine and should be fulfilled from `transaction.completed` ([Paddle developer docs](https://developer.paddle.com/get-started/how-paddle-works/digital-products/)).
- **Current behavior:** A completed one-time transaction can link a Paddle customer but has no code path that grants `PAID` without a subscription ID.
- **User consequence:** A customer may be charged yet remain on the free plan, with a thank-you screen implying activation.
- **Likely cause:** Subscription entitlement logic was reused after the offer changed to a one-time purchase.
- **Recommended change:** Fulfil one-time access from the verified completed transaction itself. Represent purchase entitlement separately from subscription lifecycle fields and show “Activating premium” until the entitlement readback succeeds.
- **Implementation guidance:** Persist an idempotent purchase/entitlement record keyed by Paddle transaction ID, map the signed custom-data user, grant the intended access on `transaction.completed` without requiring `subscriptionId`, and define refund/chargeback/revocation handling. Add webhook fixtures for duplicate and out-of-order delivery.
- **Research rationale:** Paddle explicitly makes `transaction.completed` the fulfilment point for a one-time digital product; Hifzer's displayed offer and fulfilment model must agree.
- **Expected impact / effort / confidence:** High revenue/trust impact; medium effort; high code confidence, pending a sandbox end-to-end test.
- **Dependencies and risks:** Product must define whether access is perpetual and how refunds revoke it. Migration must not accidentally upgrade unrelated support payments or downgrade existing subscribers.
- **Acceptance criteria:** A signed sandbox `transaction.completed` fixture with `subscriptionId=null` grants the purchased entitlement to the mapped user; duplicate delivery is idempotent; an unmatched transaction is quarantined/observable; thank-you reports active only after readback and offers recovery if delayed; refund/revocation policy is tested.
- **Success metric:** ≥99.9% completed-checkout-to-entitlement match rate; p95 activation under 30 seconds; zero “paid but still free” support cases.

### HF-17 — Dashboard can remain stale for up to 10 minutes after progress mutations

- **Priority / category:** High — feedback, progress accuracy, cache coherence.
- **Affected workflow and users:** Dashboard summary/details/streak/Qur'an/activity plus practice, fluency, and milestones after completing a session or recording reading.
- **Evidence:** **Code-confirmed:** the dashboard TTL is 600 seconds (`src/hifzer/dashboard/server.ts:175`) and six per-user reads use `unstable_cache` with that TTL and distinct tags (`src/hifzer/dashboard/server.ts:1085-1148`). The dashboard API uses those cached reads in normal requests (`src/app/api/dashboard/overview/route.ts:39-62`), and practice/fluency/milestones also consume the cached overview. Successful mutations write session/Qur'an/streak data (`src/app/api/session/complete/route.ts:64-73`; `src/app/api/quran/progress/track/route.ts:97-128`; `src/app/api/streak/recite/route.ts:35-37`), but a source-wide audit found no `revalidateTag` or `revalidatePath` call under `src`. **Inference:** a primed cache can therefore show pre-mutation totals until TTL expiry; this was not timed in runtime.
- **Current behavior:** Hifzer confirms progress saves but does not invalidate the user-specific aggregates that report that progress.
- **User consequence:** Returning to Today can appear to erase or ignore a just-completed act, undermining progress trust and prompting duplicate actions.
- **Likely cause:** Time-based caching was added without a mutation-to-derived-view invalidation map.
- **Recommended change:** Establish read-your-own-writes for user progress: invalidate every affected per-user dashboard tag after the transaction commits, or remove the cache from immediacy-critical views.
- **Implementation guidance:** Centralize tag names and an `invalidateDashboard(userId, domains)` helper; call it after session completion/sync, reader tracking/backfill, streak recitation, and plan/profile changes. On Next 16 route handlers, use the supported immediate tag-expiry form or refetch uncached; keep broader stale-while-revalidate only where delayed feedback is acceptable ([Next.js cache docs](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)).
- **Research rationale:** Immediate, accurate feedback supports system-status visibility (RC-08). Next.js documents on-demand invalidation after mutations; a 10-minute delay is suitable for content, not read-your-own progress.
- **Expected impact / effort / confidence:** High trust impact; medium effort; high code confidence.
- **Dependencies and risks:** Invalidating all six views after every event may raise query load. Map mutation domains precisely and observe cache-hit/latency changes.
- **Acceptance criteria:** Integration tests prime each cached view, perform each mutation, and assert the next read reflects it; offline-buffered sessions update after successful sync; duplicate mutations do not inflate totals; p95 dashboard freshness is under 2 seconds without unacceptable latency regression.
- **Success metric:** p95 mutation-to-visible-dashboard time; stale-after-save report rate; cache hit ratio and dashboard p75 latency.

### HF-18 — “Private” journal copy does not define storage and encryption boundaries

- **Priority / category:** High — privacy comprehension, trust, data architecture.
- **Affected workflow and users:** Local and account-synced journal, especially repentance and personal-dua notes; users with a linked Quran.com account.
- **Evidence:** **Code-confirmed:** composer copy says only “Private. Saved … to your account” or “only in this browser” (`src/app/(app)/journal/journal-client.tsx:1446-1454,1506-1515`). Browser notes are plaintext JSON in localStorage (`src/hifzer/journal/local-store.ts:78-88,431-440`). Account notes use ordinary `title`, `content`, `blocksJson`, `tags`, and linked-content columns (`prisma/schema.prisma:258-284`), and the server writes those values directly (`src/hifzer/journal/server.ts:623-705`); unlike Zakat's `secretCiphertext`/`encryptionVersion` fields (`prisma/schema.prisma:320-347`), journal code does not use the available AES-GCM helper (`src/hifzer/private-data/crypto.ts:34-79`). When Quran.com note scope is linked, save also attempts to send title/content to Quran.com (`src/hifzer/journal/server.ts:707-718`; `src/hifzer/quran-foundation/user-features.ts:248-259,848-924`), while Settings presents reflection export as an explicit “Use this when…” action (`src/app/(app)/settings/quran-foundation/quran-foundation-client.tsx:423-454`). **Inference, not a breach claim:** these paths leave “private” ambiguous about operator access, same-origin script access, application-layer encryption, and third-party sync. Infrastructure encryption and production access controls were not inspected.
- **Current behavior:** One reassuring adjective covers materially different storage and sharing boundaries without defining them at the decision point or in the current privacy-policy detail.
- **User consequence:** A user may disclose highly sensitive content under an inaccurate mental model of device-only, encrypted, end-to-end, or Hifzer-only storage.
- **Likely cause:** “Private” is being used as a product tone rather than a documented data classification.
- **Recommended change:** Define and expose explicit modes: browser-only, Hifzer-account sync, and optional Quran.com sync. State retention, who/processes can access, backup/export/delete behavior, and whether encryption is transport, infrastructure-at-rest, application-layer, or end-to-end. Do not imply encryption that is not implemented.
- **Implementation guidance:** Make Quran.com journal sync a clearly disclosed opt-in with visible per-note/global state. If application-layer encryption is selected, migrate content-bearing fields to versioned ciphertext with key rotation and search/sync tradeoffs; if not, revise copy and privacy policy plainly. OWASP cautions that sensitive localStorage data is readable by same-origin JavaScript and local browser access ([OWASP HTML5 storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)).
- **Research rationale:** RC-03's data-minimization/provider-disclosure principle applies strongly to sacred and confessional content; privacy comprehension must precede meaningful consent.
- **Expected impact / effort / confidence:** High trust impact; medium–large effort depending on the chosen boundary; high code confidence, medium risk confidence without infrastructure review.
- **Dependencies and risks:** Encryption changes search, previews, migrations, backups, key recovery, and Quran.com sync. Legal/privacy and security review are required; avoid promising end-to-end encryption unless key ownership supports it.
- **Acceptance criteria:** A reviewed data-classification decision covers each mode; composer and Settings identify exact storage/sync destination before save; Quran.com transfer is explicit and testable; privacy policy covers retention/export/delete/operator boundaries; if encryption is promised, tests verify no content-bearing plaintext persists and key rotation/recovery is documented.
- **Success metric:** ≥90% of usability-test participants correctly identify where a note is stored and whether it syncs; zero undisclosed-destination defects; encryption migration coverage if selected.

### HF-19 — Core shell, disclosure, bookmark-sheet, status, and progress semantics are incomplete

- **Priority / category:** High — systemic accessibility semantics and focus management.
- **Affected workflow and users:** Every app route; keyboard, switch, and screen-reader users; reader bookmark flow and onboarding/guide progress.
- **Evidence:** **Code-confirmed:** active desktop/mobile nav is styling-only and omits `aria-current` (`src/components/app/app-shell.tsx:150-178,345-364`). Learn/help section toggles show/hide content without `aria-expanded`, `aria-controls`, or controlled IDs (`app-shell.tsx:276-316`). The global skip link targets `#main-content` (`src/app/layout.tsx:91-99`), but app `<main>` is not programmatically focusable (`app-shell.tsx:332-337`), unlike the public layout's `tabIndex={-1}` (`src/app/(public)/layout.tsx:23-26`). The bookmark trigger lacks expanded/control/dialog state; its dimmed mobile sheet is a plain `<div>` with no dialog name, initial focus, trap, inert background, or focus-return logic (`src/components/bookmarks/reader-bookmark-control.tsx:90-114,147-210`), and dynamic save/sync feedback is an unannounced paragraph (`:265-275`). `ProgressBar` exposes a known range as `role="img"` plus text rather than native/ARIA progress values (`src/components/ui/progress.tsx:18-47`). **Blocked:** no screen-reader matrix was run; these are implementation gaps, not a whole-product conformance verdict.
- **Current behavior:** Visual state is generally clear, but equivalent programmatic state and predictable focus movement are inconsistent across shared primitives.
- **User consequence:** Assistive technology may not announce current location, disclosure state, save result, or progress; keyboard focus can remain behind the mobile bookmark overlay or fail to land at skipped content.
- **Likely cause:** Each component implemented visual behavior independently instead of using tested semantic primitives.
- **Recommended change:** Fix shared primitives and shell first, then audit consumers: current-page links, disclosures, skip target, modal/nonmodal sheet, status announcements, and determinate progress.
- **Implementation guidance:** Add `aria-current="page"`; add `aria-expanded`/`aria-controls` and IDs; make app main `tabIndex={-1}`; use native `<dialog>` or an APG-complete dialog with initial focus, contained Tab order, Escape, inert background, and focus return; announce bookmark outcomes through `role="status"`/`aria-live`; use `<progress>` or `role="progressbar"` with value semantics. Reuse the existing toast live region and marketing-nav ARIA patterns as precedents. See W3C APG guidance for [disclosures](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), [dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), and [range values](https://www.w3.org/WAI/ARIA/apg/practices/range-related-properties/).
- **Research rationale:** RC-05 and RC-08; important state must be programmatically determinable and announced without stealing focus.
- **Expected impact / effort / confidence:** High cross-product impact; medium effort; high code confidence.
- **Dependencies and risks:** Responsive desktop popover versus mobile modal behavior needs an explicit interaction model. ARIA without matching behavior would worsen the experience.
- **Acceptance criteria:** Automated tests assert current/disclosure/progress states; skip activation focuses the app main; bookmark open/Tab/Shift+Tab/Escape/close behave to the chosen pattern and return focus; save/error feedback is announced once; keyboard and at least one screen-reader smoke test pass at desktop and 390 px.
- **Success metric:** 100% shared-primitive semantic regression pass; zero keyboard focus escapes/obscured states in the tested flows; bookmark completion rate with screen reader.

### HF-20 — Analytics measures navigation, not core task completion and recovery

- **Priority / category:** Medium — measurement, product learning, operational readiness.
- **Affected workflow and users:** Onboarding, Qur'an resume/reading, Hifz sessions, journal/bookmarks, and paid conversion; indirectly all users because prioritization lacks behavioral evidence.
- **Evidence:** **Code-confirmed:** production includes Google Analytics, Vercel Analytics, and Speed Insights (`src/app/layout.tsx:99-104`), and `TrackedLink` emits link-click events (`src/components/telemetry/tracked-link.tsx:55-70`)—a useful foundation. In the audited tree, direct `trackGaEvent` use outside that wrapper is limited to the not-found client (`src/app/not-found.tsx:93`). Core success/outcome handlers contain no product-event call: onboarding finish (`src/app/(onboarding)/onboarding/complete/complete-client.tsx:74-116`), session completion/offline buffer (`src/app/(app)/session/session-client.tsx:624-663`), journal persistence (`src/app/(app)/journal/journal-client.tsx:459-551`), and checkout start (`src/components/billing/support-checkout-card.tsx:180-230`). Sentry captures several failures, but that is not a core-task funnel. **Inference:** no production analytics schema/dashboard outside this repository was provided.
- **Current behavior:** Hifzer can count page/navigation activity and performance, but cannot reliably separate core completion, failure, offline fallback, retry, or entitlement activation.
- **User consequence:** The team cannot validate high-impact audit hypotheses or locate the exact step where users fail; regressions may be visible only through support or aggregate traffic.
- **Likely cause:** Analytics was added at the shell/marketing layer before an event model for product outcomes.
- **Recommended change:** Define a privacy-minimizing event taxonomy around state transitions and outcomes, then instrument both client intent and server-confirmed success/failure.
- **Implementation guidance:** Version events for onboarding step/completion, resume/start, session completion and sync outcome, reader progress, bookmark/journal save outcome, checkout start/completion, entitlement applied, and recovery action. Include route/device/mode and coarse counts/durations; never include Qur'an query text, journal/dua content, audio, raw tokens, or unnecessary user identifiers. Document consent, retention, ownership, and dashboards.
- **Research rationale:** The claim ledger's route/device field-metrics hypothesis and [web.dev Web Vitals](https://web.dev/articles/vitals) help measure performance, but performance alone cannot establish task success; each audit hypothesis needs a directly observable outcome.
- **Expected impact / effort / confidence:** Medium–high decision impact; medium effort; high confidence in the repository-level coverage gap.
- **Dependencies and risks:** Religious/private behavior is sensitive. A data review and payload allowlist are mandatory; event volume and duplicate client/server events need deduplication.
- **Acceptance criteria:** A reviewed schema maps every core funnel step to success/failure/recovery; automated tests reject sensitive payload keys; server-confirmed outcomes exist for save/payment events; dashboards segment mobile/desktop and online/offline; missing-event and duplicate rates are monitored.
- **Success metric:** ≥95% valid-event coverage for eligible core-flow attempts; <1% duplicate/unknown outcomes; zero sensitive-content payload incidents; usable funnel baselines for the top five workflows.

### HF-21 — Display account-save failures are silent behind a successful local state

- **Priority / category:** High — settings persistence, error visibility, cross-device consistency.
- **Affected workflow and users:** `/settings/display`; signed-in users changing mode, surface theme, or accent, especially offline or during API/auth/database failure.
- **Evidence:** **Code-confirmed:** selecting a display value immediately writes localStorage, cookies, and document state (`src/components/providers/theme-provider.tsx:147-157,176-190`). The settings page then debounces a POST by 250 ms but neither checks `res.ok` nor parses the result; network rejection is swallowed with “Keep the local preference even if persistence fails” (`src/app/(app)/settings/display/page.tsx:128-153`). The API can return 401/400 and performs the account save (`src/app/api/profile/display/route.ts:18-47`). Therefore HTTP errors resolve silently, network errors are explicitly ignored, and the screen looks identical to a successful account save. There is no explicit success toast in the current code; “success” here means the unchanged selected/local state. **Blocked:** an intercepted 401/500/offline run was not captured.
- **Current behavior:** Local application and account synchronization are presented as one seamless state even when only the device-local half succeeded.
- **User consequence:** A preference can later revert during profile hydration or differ on another device, with no explanation or retry path.
- **Likely cause:** Optimistic local theming was implemented without a persistence state machine.
- **Recommended change:** Keep instant local preview, but distinguish **Applying locally**, **Saving to account**, **Saved to account**, and **Applied on this device—account save failed** with Retry.
- **Implementation guidance:** Await the response, check `res.ok`, parse a safe error, and track the latest mutation so rapid changes cannot acknowledge out of order. Use AbortController or a monotonically increasing request version. Announce final status through the existing toast/live-region system; do not roll back the local theme merely because remote save failed.
- **Research rationale:** RC-07 and RC-08: optimistic feedback needs explicit rollback/error behavior and programmatic status ([React `useOptimistic`](https://react.dev/reference/react/useOptimistic), [W3C status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages)).
- **Expected impact / effort / confidence:** Medium–high trust impact; small–medium effort; high code confidence.
- **Dependencies and risks:** Debounced saves can race; retry must send the latest full preference tuple. Copy must distinguish device persistence from account sync without alarming users.
- **Acceptance criteria:** Mock 200, 401, 500, offline, timeout, and out-of-order responses; only 2xx reports account-saved; failures retain the local selection, announce device-only state, and expose Retry; a successful retry clears the warning; reload/cross-device tests confirm the stored account value.
- **Success metric:** Zero silent account-save failures in automated/runtime monitoring; retry recovery rate; cross-device preference match rate; display-setting error support rate.

### HF-22 — Invalid Qur'an IDs render in-route not-found content and likely return 200

- **Priority / category:** Medium — routing semantics, recovery, analytics/SEO hygiene.
- **Affected workflow and users:** Invalid or stale links under `/quran/surah/[id]` and `/quran/juz/[id]`; crawlers, monitoring, and support diagnostics.
- **Evidence:** **Code-confirmed:** both pages coerce the route string with `Number`, look up the resource, and directly return a normal React “Not found” block when absent (`src/app/(app)/quran/surah/[id]/page.tsx:15-49`; `src/app/(app)/quran/juz/[id]/page.tsx:15-47`). Neither imports/calls `notFound()`. The recovery copy and Back to index link are useful. **Inference:** because the matched page returns ordinary content rather than triggering Next's not-found mechanism, invalid IDs likely carry a success status; HTTP headers were not captured. Next documents `notFound()`/`not-found` as the route-segment mechanism and automatic noindex path ([Next.js error handling](https://nextjs.org/docs/app/getting-started/error-handling)).
- **Current behavior:** The visible message says the resource does not exist, while the routing layer is not told it is missing; permissive `Number()` parsing also accepts non-canonical numeric strings.
- **User consequence:** Monitoring and analytics can count invalid pages as successful views, caches/crawlers receive ambiguous signals, and broken-link rates are harder to detect.
- **Likely cause:** A friendly empty/error card was implemented in the page instead of through route semantics.
- **Recommended change:** Strictly validate the segment, call `notFound()` before profile/audio work, and reuse the current range guidance/back link in a Qur'an segment `not-found.tsx`.
- **Implementation guidance:** Accept canonical integer strings only; validate Surah 1–114 and Juz 1–30; move the validity check ahead of account/database reads. Add request tests for zero, negative, overflow, decimal, exponent, alphabetic, and valid boundary IDs, including status and robots metadata.
- **Research rationale:** Correct status and recoverable content serve different layers; use both. Retaining the specific valid range follows RC-07.
- **Expected impact / effort / confidence:** Medium operational/semantic impact; small effort; high code confidence, medium status confidence until an HTTP test runs.
- **Dependencies and risks:** Next can return 200 for some streamed not-found responses, so acceptance must test this route's actual deployment behavior rather than assume. Preserve app-shell recovery and valid deep links.
- **Acceptance criteria:** Invalid canonical cases render the helpful Qur'an not-found UI, are non-indexable, and return the intended not-found response in deployed integration tests; valid 1/114 and 1/30 boundaries remain 200; invalid requests do not load profile/audio data; broken-route telemetry fires once.
- **Success metric:** 100% invalid-ID response/metadata test pass; broken-link volume by source; zero invalid Qur'an URLs classified as valid content in monitoring.

## Strengths worth preserving

1. **The brand and visual system feel unusually calm and coherent.** Screenshots `01`, `02`, `17`, and `35` show consistent glass/surface treatment, type hierarchy, and restrained teal across desktop, dark mode, 390 px, and 320 px. The landing hero reflows without horizontal scrolling at the tested compact widths.
2. **Public auth failure is honest and offers a viable path.** Screenshots `05`–`06` and `src/app/(auth)/login/[[...login]]/page.tsx:51-81` / signup equivalents explain the limitation, retain trust, and offer an anonymous reader rather than a blank wall.
3. **The keyboard skip path is visible and well focused.** Screenshot `16-landing-keyboard-skip-focus.jpg`, `src/app/(public)/layout.tsx:23-25`, and the global focus ring at `src/app/globals.css:363-366` provide a clear bypass pattern. Full keyboard/assistive-technology conformance was not established.
4. **Plan saving gives clear, nonblocking feedback.** Screenshot `14-quran-plan-saved-feedback-desktop.jpg` shows a named success and dismiss action. `src/components/ui/toast.tsx:79-113` uses a polite live region, while `quran-reading-plan-card.tsx:88-108` distinguishes successful device save from browser-blocked saving and preserves the session plan.
5. **The dashboard error is a strong recovery pattern to reuse.** Screenshot `25` offers Retry, Open Qur'an, and Help and reassures users that their reading place is safe (`dashboard-client.tsx:832-859`). HF-05 asks for parity, not replacement.
6. **Guided dua has a clear, humane sequence.** Screenshots `26`–`27` show module choice, current/visited progress, step sequence, verified-anchor labeling, and progressive disclosure of support. Keep that structure while safeguarding Reset.
7. **Journal copy attempts to state storage scope at the moment of saving.** `journal-client.tsx:1446-1455` distinguishes account and browser storage, which is the right communication pattern. Screenshots 37–38 show that the browser-save claim is currently false; preserve the specificity only after the persistence contract is made truthful and testable.
8. **AI is visibly separated as “AI beta” and marketing sets a responsible boundary.** Screenshot `04` and `landing-page.tsx:344-352` keep source labels in view and say the tool does not replace a teacher/scholar. HF-07 extends that good intent into resolvable live behavior.
9. **Loading architecture exists for core routes.** Route-level loading files and component skeletons stabilize the shell on dashboard, Qur'an, Hifz, journal, settings, and dua routes. Performance still needs field LCP/INP/CLS data before any speed claim.
10. **Shared controls already provide a usable implementation base.** `Button` has consistent 36/44/48px size tokens and visible focus styles; `Card`, `Pill`, `EmptyState`, `DisclosureCard`, and `Toast` make most recommendations evolutionary rather than a wholesale redesign.

### Additional implementation foundations

- The local-state owner model intentionally scopes sensitive browser data and clears it on a real account change; HF-00 is a lifecycle-state bug, not an absence of account isolation.
- Journal and Hifz flows already distinguish synced, local, pending, and failure outcomes in several places; the missing piece is making those guarantees consistent with actual persistence and privacy boundaries.
- The shared toast viewport already uses `aria-live="polite"`, the marketing disclosure already exposes expanded/control state, and the public main target is focusable. These are working precedents for HF-19.
- Hifzer already has GA, Vercel Analytics, Speed Insights, Sentry, and a typed event helper. HF-20 needs a privacy-reviewed outcome taxonomy, not a new analytics stack by default.
- Invalid Qur'an pages already give the valid range and a useful way back; HF-22 should preserve that recovery content while correcting route semantics.

## Evidence limits and required follow-up

- Clerk and account persistence were unavailable, so onboarding, authenticated dashboard success, Hifz session completion, bookmark sync, reminder/account management, and destructive synced-data behavior were not completed end to end.
- Quran Foundation content credentials were unavailable, so successful remote audio, official tafsir catalog, account linking, and sync recovery were not verified.
- The AI gateway was unavailable, so successful answer quality, latency, citation destinations, unsafe-topic handling, and reporting could only be inspected in code; HF-07 must be rechecked in a configured test environment.
- Compact captures used a same-origin audit viewport wrapper to render the real app at 320, 390, and 768 CSS px. They are valid layout evidence, but device browser chrome, installed-PWA safe areas, touch latency, and physical target comfort require real-device checks.
- Dark mode was captured on the landing page, not across every app route. Contrast ratios were not comprehensively measured.
- Screen-reader behavior, switch control, voice control, and full keyboard traversal were not exhaustively tested. The report therefore does not claim WCAG conformance.
- No user interviews, analytics, support logs, or field performance data were supplied. Behavioral impact and exact IA grouping remain hypotheses; instrument the proposed metrics and run representative task tests.


### Additional validation limits

Paddle fulfilment, a primed production cache, intercepted display-save failures, deployed HTTP response codes, and a screen-reader/browser matrix were not available in this audit environment. Those items are labeled Blocked or Inference above and have explicit acceptance tests. The confirmed journal reload loss is the only finding promoted to Critical.
