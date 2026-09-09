# Hifzer UI/UX audit — research

Date: 2026-09-04

Status: Complete.

Use: Research context for the audit. Comparator evidence is not evidence of a Hifzer defect; every product finding also cites current-run runtime, DOM, or code evidence.

[Executive report](README.md) · [evidence coverage](coverage.md) · [findings](findings.md) · [target experience](target-experience.md)

## Executive synthesis

Hifzer should be assessed as a calm Qur'an continuity product, not as a generic productivity dashboard or a narrow memorization tracker. The strongest cross-source pattern is a single recommended next action that preserves reading or review context, followed by contextual tools for study, recall, audio, notes, and recovery. The most important design constraint is trust: Qur'anic source material, translation, tafsir, and generated explanation must have clear provenance and distinct visual/semantic treatment. Motivation should reward return and consistency without shame, spiritual ranking, or coercive loss aversion.

The accessibility baseline is WCAG 2.2 AA across complete workflows and responsive variations. For mobile ergonomics, use the stricter 44–48 px product target for ordinary interactive regions while recognizing that WCAG 2.2 AA's target-size floor is 24 by 24 CSS px with exceptions. Arabic and mixed-script content need semantic `lang` and `dir`, bidi isolation, correct shaping/line height, and content-run testing; right alignment alone is not RTL support.

## Reconciled product direction

1. Onboarding should ask only enough to recommend a first plan: intent, current level/start range, cadence, and review preference. Presets come first; advanced schedules, multiple ranges, account linking, reminders, and microphone permissions are contextual.
2. The signed-in home should answer “What is my next meaningful Qur'an action?” Lead with due review, interrupted reading, or the active goal. Treat history, streaks, metrics, and feature discovery as supporting information.
3. Reading continuity should preserve ayah/page, reading mode, translation, reciter, and audio position. Resume should be a first-class action.
4. Reading, listening, memorizing, and reviewing require distinct progress semantics. Memorization credit should require active recall rather than passive exposure.
5. Recitation feedback should be immediate, granular, inspectable, and never color-only. Model unresolved, corrected, low-confidence, processing, silence, permission, failure, and retry states.
6. Bookmark and journal actions should be capture-first at the ayah, with organization after capture, a backlink, autosave/sync status, and explicit privacy behavior.
7. Generated guidance should be opt-in and visibly separate from canonical Qur'an, translation, and tafsir; include resolvable sources, limitations, reporting, and a path to qualified human guidance.
8. Motivation should use weekly consistency, gentle recovery, hideable streaks, and restart celebration—not shame, FOMO, public devotional ranking, or brittle perfection.
9. A compact shell should expose roughly four or five stable, labeled peers; a strong hypothesis is Today, Qur'an, Practice, Journal, and More. Larger widths can adapt to a rail/sidebar.
10. Loading and mutations should keep the shell stable, show immediate pending state, preserve user effort, support cancellation/retry where relevant, and announce important status without stealing focus.

## Classification

### Durable principles

- Preserve context and resume state across visits.
- Reduce choice paralysis with one recommended next step.
- Use active recall, spaced review, and mistake-specific practice.
- Preserve user control, reversibility, and effort during failures.
- Keep canonical content authoritative and generated commentary subordinate.
- Ask for data and permissions at the point of need and explain why.
- Make progress encouraging, recoverable, and user-controlled.
- Use semantic language/direction, reflow, visible focus, sufficient contrast, and usable target sizes.

### Established contemporary patterns

- A “today” card that starts the assigned portion directly.
- Quick plan presets with advanced customization behind progressive disclosure.
- Contextual per-ayah audio, bookmark, note, study, and share actions.
- Persistent reading position plus “continue from…” language.
- Ayah/range repeat, speed, reciter, and a persistent mini-player.
- Integrated mistake repair and weak-content history.
- Adaptive bottom navigation, rail, or sidebar according to width and hierarchy.
- Local, actionable validation that preserves entered content.

### Current implementation guidance

- Next.js prefetching, route-level `loading.tsx`, streaming, and stable content-shaped fallbacks.
- React transitions for eligible expensive updates and optimistic feedback for safe mutations, with explicit rollback/error behavior.
- Field performance by route and device using LCP, INP, and CLS plus product task metrics.

### Short-lived trends to filter

- Mascot-heavy journeys, fiery streaks, badge walls, shame-red missed-day calendars, novelty level names, decorative giant progress rings, and “premium devotional” dark-card treatments.
- Material 3 Expressive styling and similar visual fashions are not audit criteria; structure and state semantics may transfer, visual identity need not.

### Experimental hypotheses requiring validation

- Gentle recovery after missed days.
- Confidence-aware recitation feedback with replay, dismiss, and manual correction.
- Daily portions that rebalance after missed or ahead-of-plan sessions.
- Temporary line-focus mode for fluency and memorization.
- Layered AI answers: concise meaning, context, related ayat, then named-source detail.
- Dashboard ranking: due review, then interrupted session, then goal recommendation.

## Source-provenance record

Access dates are 2026-09-04 unless another date is stated. Publication/update dates below are those visible in the source or source metadata.

### Qur'an ecosystem and category products

1. **Quran.com / Quran Foundation — Product Updates.** Feature index through 2026-02-16. Documents verse/page bookmark continuity, Study Mode, pin-and-compare, translation reading mode, feedback, learning plans, accounts, word-level audio, notifications, ayah notes, collections, and streaks. Relevant to reader, journal, goals, and continuity. High confidence for announced behavior; no adoption evidence. https://quran.com/product-updates
2. **Quran Foundation — Developer Journey.** Current developer documentation. Content APIs do not require user login; bookmarks, collections, notes, progress, goals, and preferences use authenticated user APIs. Relevant to implementation boundaries and optional account linking. High confidence. https://api-docs.quran.com/docs/developer-journey/
3. **Quran Foundation — Add or update user reading session.** Current API documentation. Models resume state by latest surah/ayah, a new session after more than 20 minutes, and debounced visible-ayah updates; distinguishes sessions from activity-day streaks. Relevant to resume semantics. High confidence. https://api-docs.quran.com/docs/user_related_apis_versioned/1.0.0/add-or-update-user-reading-session/
4. **Quran Foundation — Connected Apps.** v1.1, 2026-08-10. Requires AI disclosure, separation from canonical sources, resolvable citations, non-authoritative framing, appropriate review, data minimization/provider disclosure, and reporting; rejects shame, spiritual rank, coercive loss aversion, FOMO, and vanity leaderboards. High-confidence normative ecosystem guidance, not task-success evidence. https://api-docs.quran.com/docs/connected-apps/
5. **Quran.com — Apps.** Current ecosystem directory. Shows cross-device account continuity for bookmarks, collections, reflections, and progress plus a range of reader/study/reflection apps. High confidence for ecosystem positioning. https://quran.com/apps
6. **Tarteel — Product.** Current site describes memorization mistake detection, planning, and goals. Medium confidence as marketing evidence. https://tarteel.ai/
7. **Tarteel Help — Premium features.** 2025-09-25. Documents mistake detection, engagement analytics, journey planning, historical mistakes, and peeking. High confidence for offered behavior; premium and accuracy limits apply. https://support.tarteel.ai/en/articles/12414460-what-features-do-i-unlock-with-tarteel-premium
8. **Tarteel Help — Goals.** 2025-11-07. Documents suggested and custom goals, generated portions, separate memorize/review/recite intentions, flexible/fixed plans, ranges, reverse order, off-platform sessions, and advanced inclusion rules. High confidence for behavior; also evidence of complexity risk. https://support.tarteel.ai/en/articles/12782033-how-do-i-use-the-goals-feature
9. **Tarteel Help — Mistake Detection.** 2025-11-07. Documents live word feedback, redundant dotted underline, persistent corrected-history color, configurable tashkeel detection, and microphone troubleshooting. High confidence for interaction; no quantified recognition accuracy. https://support.tarteel.ai/en/articles/12414419-how-to-activate-mistake-detection
10. **Quranly.** Current marketing page; no visible publication date. Shows customizable daily goals, time/verse progress in the reader, weekly home tracking, levels from two minutes, and an optional friends leaderboard. Medium confidence. Leaderboard/loss framing conflicts with Quran Foundation's current connected-app guidance. https://www.quranly.app/
11. **Muslim Pro — Holy Quran App.** Published 2026-06-02, updated 2026-07-22. Describes resume, translation/transliteration, verse actions, tajweed explanation, audio speed/looping/reciters, khatam pacing/reminders, bookmarks, notes, playlists, history, and goals. Medium-high confidence for offered features; marketing evidence and some premium gating. https://www.muslimpro.com/holy-quran-app/
12. **Muslim Pro Help — AiDeen sources and verification.** Updated 2024-02-26. Frames AI as supplementary and unsuitable for rulings/theological debate, recommends cross-checking and scholars, and mentions feedback/safety controls. High confidence for stated policy; claim-level citation behavior remains a gap. https://support.muslimpro.com/help/en/articles/what-is-the-source-for-aideen-s-reply-is-it-verified

### Motivation, onboarding, and adjacent reading patterns

13. **Duolingo — How to use Duolingo.** Published 2024-12-02, updated 2026-02-11. Documents motivation/goal questions, beginner vs placement entry, optional reminders, later preference editing, bite-sized progression, and personalized review. Useful onboarding analogy; imperfect transfer to teacher-led hifz. https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/
14. **Duolingo — Home screen redesign.** Published 2022-05-06, updated 2025-06-13. Describes replacing a choice-heavy tree with a guided path, smaller units, spaced practice, and a return-to-position control. Medium-high confidence; Hifzer should recommend rather than force a rigid path. https://blog.duolingo.com/new-duolingo-home-screen-design/
15. **Duolingo — Streak habit research.** Published 2022-01-31, updated 2026-06-09. Reports a 1.7% lift in new-user seven-day retention from celebration and 0.38% relative daily-activity lift from two freezes. Medium confidence because self-reported; loss aversion conflicts with sacred-context constraints. https://blog.duolingo.com/how-duolingo-streak-builds-habit/
16. **Duolingo — Streak milestone design.** First-party explanation of milestone salience. Use only as evidence of a category pattern, not a Hifzer requirement. https://blog.duolingo.com/streak-milestone-design-animation/
17. **Duolingo — Improving the streak.** First-party iteration account. Use only with the same self-report and sacred-context caveats. https://blog.duolingo.com/improving-the-streak/
18. **Headspace — Building a meditation practice.** Andy Puddicombe, 2023-10-18. Describes both motivation and anxiety from streaks, emphasizes that missed days do not erase benefit, and prioritizes return over the number. Medium-confidence qualitative, first-party guidance; close tonal analogue. https://www.headspace.com/articles/building-a-meditation-practice
19. **Headspace — App.** Current product page showing personalization, progress, and reminders. Medium confidence as marketing evidence. https://www.headspace.com/app
20. **Apple Support — Read books in Books on iPhone.** iOS 26 documentation. Home emphasizes currently reading content and goals; Library holds collections; Line Guide dims surrounding lines; current UI uses five bottom destinations. High confidence for current native behavior; native/commercial-book context limits transfer. https://support.apple.com/guide/iphone/read-books-iphc1af7c57/26/ios/26

### Accessibility, directionality, and platform ergonomics

21. **W3C — WCAG 2.2.** Recommendation republished 2024-12-12. Relevant AA criteria include 4.5:1 normal-text contrast, 3:1 large text/non-text contrast, 200% text resize, 320 CSS px reflow, visible and not-entirely-obscured keyboard focus, 24×24 CSS px AA target-size floor with exceptions, textual error identification and suggestions, reversible/checked/confirmed stored-data changes, programmatic status messages, and language of parts. Very high confidence. Conformance applies across responsive variations and complete processes; screenshots/automation cannot prove conformance. https://www.w3.org/TR/WCAG22/
22. **W3C WAI — Understanding WCAG 2.2.** Updated 2026-02-11. Supporting explanatory index. https://www.w3.org/WAI/WCAG22/Understanding/
23. **W3C WAI — Reflow.** Explains 320 CSS px expectations and exceptions. https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
24. **W3C WAI — Target Size (Minimum).** Explains 24×24 CSS px AA floor and exceptions; product ergonomic target remains 44–48 px. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
25. **W3C WAI — Status Messages.** Explains programmatic announcement without focus theft. https://www.w3.org/WAI/WCAG22/Understanding/status-messages
26. **W3C WAI — What's New in WCAG 2.2.** Published 2023-10-05. Highlights focus not obscured, focus appearance, target size/spacing, non-drag alternatives, consistent help, redundant-entry avoidance, and accessible authentication. High confidence; additions only, not the whole standard. https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
27. **W3C Internationalization — Structural markup and RTL text in HTML.** Explains independent `lang` and `dir`, document `dir="rtl"`, logical start/end properties, and `dir="auto"` for mixed user content. Very high confidence; mixed Qur'anic/Latin/numeric runs still require browser testing. https://www.w3.org/International/questions/qa-html-dir.en
28. **W3C Internationalization — Arabic & Persian Layout Requirements.** Group Draft Note, 2025-10-02. Covers RTL structure, LTR numeral runs, joining, ligatures, diacritics, wrapping, justification, and line-height needs. Medium-high expert confidence; not a complete Qur'anic orthography specification. https://www.w3.org/TR/alreq/
29. **Apple HIG — Right to left.** Current platform guidance for mirrored layout and semantic directionality. High confidence as platform guidance, not web conformance. https://developer.apple.com/design/human-interface-guidelines/right-to-left
30. **Apple HIG — Buttons.** Updated 2025-12-16. Recommends at least a 44×44 pt hit region, press state, clear text/familiar icons, restrained primary emphasis, and changed-label/activity feedback for delayed actions. High confidence for Apple ergonomics; cross-platform web transfer is a product target. https://developer.apple.com/design/human-interface-guidelines/buttons
31. **Apple HIG — Tab bars.** Updated 2026-06-08. Stable labeled top-level navigation, state preservation, explanatory disabled states, fewer peers, and sidebar adaptation; five or fewer default custom tabs. High confidence as native pattern evidence. https://developer.apple.com/design/human-interface-guidelines/tab-bars
32. **Android Developers — Layout and navigation patterns.** Current guidance: three to five same-level compact destinations, rail at larger widths, one highest-priority action, overflow for lower-frequency actions. High confidence for platform pattern; web implementation still needs testing. https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns?hl=en
33. **Android Developers — Adaptive navigation.** Current guidance for navigation bar/rail/drawer changes according to window class. https://developer.android.com/develop/adaptive-apps/guides/build-adaptive-navigation
34. **Android Developers — Adaptive dos and don'ts.** Current adaptive-layout guidance. https://developer.android.com/develop/adaptive-apps/guides/adaptive-dos-and-donts
35. **Android Developers — Canonical layouts.** Current list/detail/feed/supporting-pane patterns. https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts
36. **Android Developers — Material 3 in Compose.** Updated 2026-08-14. Bar for compact ≤5 destinations, rail for small/medium tablet or landscape, drawer for medium/large tablet; theme roles support consistent emphasis. High confidence for structure, not reusable web code. https://developer.android.com/develop/ui/compose/designsystems/material3
37. **Android Developers — Accessibility API defaults.** Updated 2026-07-21. 48 dp ergonomic target, smaller visible art within a larger hit region, overlap avoidance, standard semantics, and descriptions/grouping for custom controls. High confidence; treat CSS mapping as product guidance rather than formal conversion. https://developer.android.com/develop/ui/compose/accessibility/api-defaults

### Usability and content-state design

38. **Nielsen Norman Group — 10 Usability Heuristics.** Jakob Nielsen; 1994-04-24, reviewed 2024-01-30. System visibility, user-language match, control/undo, consistency, prevention, recognition, accelerators, minimalism, recovery, and contextual help. High confidence as heuristic baseline; direct evidence is still required for severity. https://www.nngroup.com/articles/ten-usability-heuristics/
39. **Nielsen Norman Group — Website Response Times.** Jakob Nielsen, 2010-06-20. Approximate perception bands of 0.1 s/direct, 1 s/flow, and 10 s/attention. Medium-high durable human-factors relevance; not a modern SLO. https://www.nngroup.com/articles/website-response-times/
40. **Nielsen Norman Group — Onboarding Tutorials vs Contextual Help.** Page Laubheimer, 2023-02-12. Tutorials are skipped, interrupt intent, and are forgotten out of context; contextual help should be dismissible, recoverable, and progressively disclosed. High confidence. https://www.nngroup.com/articles/onboarding-tutorials/
41. **Nielsen Norman Group — Mobile Tutorials.** Supporting evidence on skipped/forgettable mobile tours. https://www.nngroup.com/articles/mobile-tutorials/
42. **Nielsen Norman Group — Progressive Disclosure.** Durable guidance for showing common/simple choices before advanced detail. https://www.nngroup.com/articles/progressive-disclosure/
43. **Nielsen Norman Group — Dashboards.** Page Laubheimer, 2017-06-18. An actionable at-a-glance dashboard differs from a portal that mainly launches resources. Medium-high transfer; Hifzer may legitimately be a restrained hybrid. https://www.nngroup.com/articles/dashboards-preattentive/
44. **Nielsen Norman Group — Filter categories and values.** Kate Moran, 2018-07-15. Filters should match user vocabulary, be appropriate/predictable/prioritized, expose active context and result effect, and use evidence from users/search/analytics. Medium-high; ecommerce origin limits direct transfer. https://www.nngroup.com/articles/filter-categories-values/
45. **Nielsen Norman Group — Form error guidelines.** Rachel Krause; 2019-02-03, reviewed 2024-12-12. Errors should be noticeable, understandable, local, persistent enough to act on, timed after reasonable completion, input-preserving, and escalated with help after repeated failure. High confidence. https://www.nngroup.com/articles/errors-forms-design-guidelines/
46. **Nielsen Norman Group — Empty state interface design.** Current usability guidance for orienting users and offering a next action rather than leaving a blank surface. https://www.nngroup.com/articles/empty-state-interface-design/
47. **Nielsen Norman Group — Visual hierarchy.** Current guidance for sequencing attention and grouping by importance. https://www.nngroup.com/articles/visual-hierarchy-ux-definition/

### Web implementation and measurement

48. **Next.js — Linking and Navigating.** Updated 2026-08-25. Prefetch, route-level loading, streaming, shared-layout continuity, and interruptible navigation. Very high confidence for this Next.js codebase. https://nextjs.org/docs/app/getting-started/linking-and-navigating
49. **Next.js — Fetching Data.** Current server/client data and streaming guidance. https://nextjs.org/docs/app/getting-started/fetching-data
50. **Next.js — Lazy Loading.** Current client bundle and deferred-loading guidance. https://nextjs.org/docs/app/guides/lazy-loading
51. **React — `useTransition`.** Current documentation. Eligible expensive updates can remain nonblocking and expose `isPending`; controlled inputs and post-`await` updates need care. High confidence; not a network-speed fix. https://react.dev/reference/react/useTransition
52. **React — `useOptimistic`.** Current documentation. Supports immediate optimistic feedback; Hifzer mutations still need a pending label/disabled state plus rollback and error recovery. https://react.dev/reference/react/useOptimistic
53. **web.dev — Web Vitals.** Published 2020-05-04, updated 2024-10-31. Good thresholds: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 at p75, segmented mobile/desktop. Very high confidence; not proof of usability/accessibility. https://web.dev/articles/vitals
54. **web.dev — Optimize INP.** Updated 2025-09-02. Diagnose field interactions and reduce input delay, processing, presentation, main-thread, DOM, and rendering costs. https://web.dev/articles/optimize-inp
55. **web.dev — `content-visibility`.** Current guidance for deferring offscreen rendering in long content with layout/accessibility caveats. https://web.dev/articles/content-visibility
56. **web.dev — Reduced motion.** Current guidance for honoring `prefers-reduced-motion`. https://web.dev/articles/prefers-reduced-motion

## Research-to-audit metrics

- Median and p75 time from signup to first meaningful reading/review action.
- Onboarding-start to first-session conversion and abandonment by step.
- Primary dashboard CTA start rate and time-to-first-core-action.
- Resume accuracy for ayah/page, mode, translation, reciter, and audio position.
- Due-review start/completion and repeated-error rate by passage.
- Microphone permission/failure recovery and low-confidence correction rate.
- Bookmark/note capture time, revisit rate, and failed-save recovery.
- AI source-open, report, retry, and abandon rate.
- Reminder opt-out and return rate after a missed day.
- Compact navigation task success and route-switch error rate.
- Arabic/mixed-script reflow, focus, and target-size pass rate.
- LCP, INP, and CLS p75 segmented by route and mobile/desktop.

## Explicit research gaps

- Comparator pages document offered behavior, not adoption, comprehension, accuracy, or task success.
- No Hifzer user interviews, analytics, support logs, or field performance were provided; recommendations requiring behavioral certainty must be framed as hypotheses and instrumented.
- Tarteel recognition accuracy, latency, noisy-room behavior, and false-positive correction costs are not quantified in accessible first-party evidence.
- Native Apple/Android dimensions are ergonomic product guidance, not web conformance requirements.
- W3C Arabic Layout Requirements is a draft note and not a full Qur'anic orthography/tajweed specification.
- A full accessibility conformance claim requires assistive-technology testing and complete processes beyond this evidence-based visual/DOM audit.
