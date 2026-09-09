# Design QA — Journal focus mode (Option 3)

## Evidence

- Reference concept: [40-journal-focus-reference.png](docs/ui-ux-audit/screenshots/40-journal-focus-reference.png), 1487 × 1058.
- Live implementation capture: [39-journal-focus-option-3.png](docs/ui-ux-audit/screenshots/39-journal-focus-option-3.png), 1247 × 726.
- Paired comparison: [41-journal-focus-comparison.png](docs/ui-ux-audit/screenshots/41-journal-focus-comparison.png), 2514 × 774.
- Runtime checked at [http://localhost:3000/journal](http://localhost:3000/journal) with an existing device-only reflection in the desktop light theme.

The comparison places the source and implementation in one image. The taller source was normalized to the implementation width and top-cropped so that the navigation rail, top bar, writing canvas, insert dock, and sticky status area can be compared at the same scale. The small circular Next.js control in the live capture is development tooling, not application UI.

## Visual comparison

- **Layout and hierarchy — passed.** The compact 108 px icon rail, restrained top bar, centered private-state label, wide writing surface, floating insert dock, details region, and sticky completion bar reproduce the source hierarchy.
- **Typography — passed.** The large serif note title and long-form body create the intended quiet editorial tone, while navigation, controls, and status copy remain compact sans serif.
- **Color and atmosphere — passed.** Pale teal navigation, warm white content, dark green ink, soft borders, and the generated low-contrast ambience preserve the sanctuary direction without reducing text contrast.
- **Iconography and controls — passed.** Existing Hifzer and Lucide assets replace the concept's illustrative placeholders while retaining the same affordances and visual weight.
- **Copy and truthfulness — passed.** Device-only and account-backed states use verified storage language; the implementation does not claim a sync state that is not actually available.

Intentional deltas are limited to product-truthful substitutions: **Text block** replaces the unsupported divider, the existing Hifzer icon system replaces concept-only marks, and the generated abstract mosque ambience avoids decorative faux Arabic calligraphy.

## Interaction and accessibility review

- The editor exposes named title and note fields, a labeled insert group, a disclosure for note details, pressed/checked states, and a named overflow menu.
- Menu, insert, and details controls support keyboard focus, Escape behavior, visible focus indicators, and focus return to the invoking control.
- A live interaction smoke test created a device-only reflection, edited two text blocks, confirmed autosave, completed the editor with **Done**, reopened the note, verified the exact title and both text blocks were restored, then removed only the disposable QA entry after confirmation.
- Save-before-switch, autosave, route interception, before-unload protection, and same-tab session recovery were verified in code and focused tests. Existing notes can be intentionally cleared without resurrecting old content.
- Account sync uses optimistic version checks, durable local queueing, conflict-safe recovery, and an explicit non-sensitive remote representation when a linked Quran.com note is cleared.
- Responsive rules were reviewed at the 1120, 900, 767, and 480 px breakpoints. The mobile navigation is hidden only while the journal editor is open, controls reflow, and the textarea fallback remains scrollable on browsers without content sizing support. Physical iOS/Android and assistive-technology runs remain release QA rather than concept acceptance criteria.

## Resolved findings

- Save-time typing, route-leave, history-navigation, empty-note, and query-prefill races now fail safe instead of discarding newer words.
- Account API omission versus explicit-clear semantics are distinct, including content-only legacy updates.
- Recovery snapshots are scoped per tab and account/device, expire, restore exact drafts, preserve divergent drafts as new copies, and are retired after verified persistence or conflict resolution.
- Pin-limit autosave loops, menu focus handling, insert focus restoration, textarea fallback ordering, and misleading save-state copy were corrected.
- Concurrent queue flushes now share one result, stale account refreshes cannot replace newer note state, and older mutation-less tabs cannot overwrite or recreate deleted notes.

## Validation

- Vitest: 319 passed, 6 skipped across 58 files.
- ESLint: passed with no findings.
- Text encoding: passed across 532 files.
- Prisma schema validation: passed.
- Production build: passed; TypeScript completed and 136/136 static pages generated.
- Live journal route: HTTP 200.

## Final result

final result: passed

---

# Design QA — High-impact completion pass

## Outcome

The audit's NOW trust and usability package is implemented locally. The shipped direction keeps the quiet journal
concept while extending its core principles—one clear next action, private progress, explicit destinations, generous
touch targets, safe recovery, and honest system status—across Dashboard, Qur'an, Hifz, Dua, Settings, AI, and billing.

## Closed high-impact findings

- Devotional rank, named spiritual tiers, medals, and locked status are removed in favor of private reading history.
- Dashboard and Qur'an surfaces put a deterministic recommended action ahead of aggregate progress.
- Compact reader/audio/bookmark controls reflow without collision and preserve at least 44 px primary hit targets.
- Mobile navigation reserves bottom space for content and keyboard focus; current-page, disclosure, skip-target,
  dialog, live-status, and progress semantics are now programmatic.
- Auth, audio, AI, and error-boundary states redact implementation details and offer a working alternate path.
- Dua progress reset and journal discard/reset paths describe consequences and require confirmation.
- Mostly English pages remain truthfully `lang="en"`; Arabic runs are explicitly `lang="ar" dir="rtl"`, while
  translated shell regions own their scoped locale and direction.
- One-time Paddle purchases create durable idempotent premium entitlements; full approved refunds/chargebacks revoke
  them, reversals restore them, subscriptions cannot accidentally downgrade an active lifetime entitlement, and the
  thank-you screen waits for verified readback.
- Dashboard user caches invalidate after session completion/sync, Qur'an progress, streak recitation, and billing changes.
- Journal storage boundaries are explicit. Reflection text stays in the browser or Hifzer account and crosses to
  Quran.com only through the dedicated import/export actions.
- Display settings distinguish instant device application from account-save confirmation and expose retry/sign-in recovery.
- Product telemetry is schema-versioned and allowlisted; tests reject journal/free-form content, email/account IDs,
  tokens, URL queries, and stack traces.

## Validation

- Vitest: 342 passed, 6 skipped across 64 files.
- ESLint: passed with no findings.
- Text encoding: passed across 549 files.
- Prisma schema validation and client generation: passed.
- Production build: passed; TypeScript completed and 137/137 static pages generated.
- High-impact Playwright flow: 3/3 passed at 320 and 390 CSS px.
- Mobile route audit: 76/76 route/viewport combinations passed at 360 and 414 CSS px with zero horizontal overflow.

## Remaining release-environment checks

Implementation is complete, but production promotion still requires the configured service checks in
`docs/high-impact-smoke-matrix.md`: a real Clerk test identity, database migration deployment, signed Paddle sandbox
webhooks (including duplicate/refund/reversal fixtures), successful Quran.com/AI paths, and physical-device plus
screen-reader smoke tests. These require credentials or hardware not present in this local run.

final result: implementation passed; external integration gates pending
