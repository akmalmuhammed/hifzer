# Hifzer UI/UX audit — coverage

Date: 2026-09-04
Status: Complete within the documented access constraints

[Executive report](README.md) · [findings](findings.md) · [target experience](target-experience.md) · [roadmap](roadmap.md)

## Coverage legend

| Mark | Meaning |
|---|---|
| **Runtime** | Directly opened or operated in the current local application and supported by a numbered screenshot. |
| **Runtime—degraded** | Directly opened, but only a guest, unavailable, unauthorized, or integration-failure state was reachable. |
| **Code** | Current route/component/state was inspected in source, but not exercised visually in this run. |
| **Blocked** | The consequential happy path requires credentials, seeded data, an integration, permission, or production-like environment that was unavailable. |
| **Not covered** | Known surface outside the practical depth of this run; no outcome claim is made. |

Historical audit files in the repository were not treated as current-run product evidence.

## Role and account-state inventory

| Role or state | What the product permits | Coverage | Notes |
|---|---|---|---|
| Public visitor | Landing, comparison/changelog/legal/marketing surfaces, auth entry, Qur'an preview | Runtime for landing and auth entry; Code for other public routes | Landing covered across light/dark, desktop/compact, keyboard entry, and Urdu/RTL. |
| Anonymous reader | Special read-only /quran/read route with local Qur'an content; no saved progress/bookmarks | Runtime | Core content, settings, validation, audio/AI failure, compact/tablet/reflow states captured. |
| Signed-in, onboarding incomplete | Three-step assessment → start point → complete; shell remains gated | Code; Blocked | Clerk user and seeded profile unavailable. Older onboarding URLs redirect to assessment. |
| Signed-in, onboarding complete | Dashboard and protected product lanes, persistence, streaks, history | Runtime—degraded; Code; Blocked | Dashboard, Hifz, and Trackers produced error/unauthorized states; no successful signed-in day/session. |
| Quran.com-linked user | Official account resume, bookmarks/collections/notes, content and audio enrichment according to granted scopes | Code; Blocked | No OAuth account or content credentials. Do not infer successful sync from local surfaces. |
| Local-only/degraded user | Local reading plan, guest reading, local journal/dua state where supported | Runtime | Reading-plan success was captured, but a journal note reported as saved was lost after reload (37–38); local resilience cannot be assumed. |
| Paid/billing state | Upgrade, receipt, buyer-help/manage, thank-you routes | Code; Blocked | Paddle and authenticated billing state unavailable. |
| Teacher/admin | No launched top-level UI found | Out of scope | Teacher-circle database models are groundwork, not a current user-facing role. |

## Route and screen inventory

### Public and authentication

| Route family | Current routes | Product purpose | Coverage |
|---|---|---|---|
| Public landing | / | Positioning, navigation, language/theme, account and reader entry | Runtime: 01–04, 16–17, 23, 35; step 15 rejected |
| Public Qur'an preview | /quran-preview | Read-before-account entry and surah index | Code; destination anonymous reader covered |
| Public proof/content | /compare, /changelog, /judge, /motivation, /pay | Comparison, release notes, integration proof, motivation, checkout entry | Code only |
| Public legal/account utility | /legal, /legal/privacy, /legal/terms, /legal/refund-policy, /legal/sources, /unsubscribe | Policy, source, refund, and email-preference information | Code only |
| Public alias | /welcome → / | Compatibility entry | Code only |
| Auth | /login, /signup | Clerk sign-in/sign-up or transparent unavailable fallback | Runtime—degraded: 05–06 |
| Auth support/callback | /forgot-password → /login, /login/sso-callback, /signup/sso-callback | Recovery and SSO completion | Code; live auth blocked |

### Onboarding

| Route family | Current routes | Product purpose | Coverage |
|---|---|---|---|
| Current three-step onboarding | /onboarding/assessment, /onboarding/start-point, /onboarding/complete | Cadence/assessment, starting position, completion and optional Quran.com state | Code; Blocked |
| Compatibility onboarding routes | /onboarding/welcome, /onboarding/fluency-check, /onboarding/plan-preview, /onboarding/permissions → assessment | Redirect older/deep links into the current flow | Code; Blocked |

### Main product

| Route family | Current routes | Product purpose | Coverage |
|---|---|---|---|
| Daily home | /dashboard; /today → /dashboard | Next work, Qur'an continuity, quick actions, review/streak/progress | Runtime—degraded: 25; happy path Blocked |
| Qur'an hub | /quran | Continue, progress, private milestones/rank, reading plan, tools | Runtime local/degraded: 12–14, 33–34 |
| Qur'an reader | /quran/read; /reader → compact reader | List/compact reading, filters, audio, translation, tafsir, AI, bookmark/journal actions | Runtime anonymous: 07–11, 18–22, 36 |
| Qur'an secondary | /quran/bookmarks, /quran/glossary, /quran/progress, /quran/surah/[id], /quran/juz/[id]; /bookmarks → /quran/bookmarks | Saved material, terms, progress, surah/juz entry | Code; persistence paths Blocked |
| Hifz | /hifz, /hifz/progress; /session → /hifz | SRS queue, active recall, grading, weak-transition repair, progress | Runtime—degraded: 24; happy path Blocked |
| Dua | /dua, /dua/[moduleId], /dua/[moduleId]/deck; /duas → /dua | Guided modules, step progress, personal dua deck | Runtime: 26–27; custom/persisted mutations not covered |
| Journal | /journal | Private notes, blocks, ayah/dua links, tags, local/synced persistence | Runtime: editor 28, save 37, reload loss 38; account sync/delete Blocked or not operated |
| Ask Qur'an | /assistant | Topic query, matched ayahs, grounded generated answer | Runtime—degraded: 30–31; successful sourced answer Blocked |
| Trackers | /worship | Daily worship tracking | Runtime—degraded: 29; happy path Blocked |
| Practice and fluency | /practice, /fluency, /fluency/lesson/[id], /fluency/retest | Rescue practice, listening/recitation lessons, retest | Code; Blocked |
| Engagement | /milestones, /notifications, /ramadan | Progress moments, reminder settings/history, seasonal plan | Code; Blocked |
| Settings | /settings, /settings/account, /settings/display, /settings/language, /settings/plan, /settings/quran-foundation, /settings/reciter, /settings/reminders | Preferences, connection, account, plan, reminders | Runtime hub at compact width: 32; detail routes Code/Blocked |
| Product/support | /roadmap, /support | Product direction, help/feedback | Code; support authenticated path Blocked |
| Billing | /billing/upgrade, /billing/manage, /billing/thank-you; /billing/success → thank-you | One-time premium/checkout, receipts, buyer help | Code; Blocked |

### Compatibility and legacy

| Route family | Current behavior | Coverage |
|---|---|---|
| /app and /app/* | Next configuration redirects to /dashboard | Code |
| /sign-in and /sign-up | Redirect to /login and /signup | Code |
| /legacy and /legacy/* | Current request proxy redirects to /; retained page files are not a current product surface | Code |

## Navigation inventory

### Desktop shell

- Primary: Today (/dashboard), Qur'an, Hifz, Dua, Trackers (/worship), Journal.
- Learn: Qur'an words (/quran/glossary), Ask Qur'an.
- Product/help: What's next (/roadmap), Help (/support).
- Settings and language remain in the sidebar.

### Compact shell

- Fixed six-item bottom bar: Today, Qur'an, Hifz, Dua, Trackers, More.
- More currently routes to /settings.
- Journal, Ask Qur'an, Roadmap, and Support have no direct item in the compact bar.

### Public landing

- Desktop story anchors: Read, Memorize, Understand, Reflect.
- Sign in, Start my routine, language, and theme actions.
- Compact landing uses a hamburger menu for the same story/auth/theme/language actions.

### Important redirect paths

- Post-auth target: /dashboard.
- /today → /dashboard.
- /session → /hifz, preserving the query string.
- /reader → /quran/read?view=compact.
- /bookmarks → /quran/bookmarks.
- /duas → /dua.

## Important component and state inventory

| Area | Main implementation surfaces | Meaningful states found | Coverage |
|---|---|---|---|
| Landing | LandingPageContent, MarketingNav, theme/language providers | light, dark, mobile menu trigger, RTL, keyboard skip link | Runtime except open mobile menu |
| Shell | AppShell, mobile navigation, StreakCornerBadge, app side effects | desktop sidebar, fixed compact bar, active route, collapsed nav groups, prefetch | Runtime + Code |
| Dashboard | dashboard page/client, first-run guide, connected Quran.com card | loading, successful overview, first run, connected/reconnect, error | Error Runtime; other states Code/Blocked |
| Qur'an hub | progress surface, reading-plan card, Quran.com connection tools | empty/zero progress, plan presets, local save success, connected/degraded | Local Runtime; connection Blocked |
| Reader | reader page, CompactReaderClient, filter controls, audio player, official tafsir, AI panel, bookmark/journal actions | compact/list, settings closed/open, translation/phonetic/tafsir toggles, native range validation, no results, anonymous disabled save, audio unavailable, AI unavailable | Core Runtime; no-results and success integrations Code/Blocked |
| Hifz | SessionClient and progress route | queue loading, unauthorized/unavailable, active attempt, grading, completion | Unauthorized Runtime; active path Blocked |
| Dua | DuaExperienceClient and deck route | module list, guided step, visited progress, custom deck, reset | List/step Runtime; persistence and reset outcome not operated |
| Journal | JournalClient, ProfileHydrator, identity side effects, and local/sync stores | empty/new draft, saved-local feedback, reload, linked blocks, tags, dirty state, local/sync error, discard/delete | Editor/save/reload Runtime; deterministic loss path Code; account sync Blocked |
| Ask Qur'an | QuranAiAssistantPanel | empty validation, pending, answer, unavailable/error, retry | Validation/error Runtime; successful answer Blocked |
| Settings | SettingsHub and detail clients | category hub, display/language/plan/reciter/reminder/Quran.com/account states | Compact hub Runtime; details Code/Blocked |
| Cross-cutting feedback | ToastProvider, route-loading components, error boundaries, shared inputs/buttons/cards/pills | polite toast, skeleton/loading, generic route error, inline input state | Toast Runtime; loading mostly Code |

## Workflow priority and coverage matrix

Rank definitions: High means central to repeated Qur'an use or conversion; Medium means meaningful supporting value; Low means occasional/operational. These are audit rankings inferred from the product, not usage analytics.

| Workflow | User/value | Frequency | Friction risk | Business/strategic importance | Evidence and coverage | Result |
|---|---|---|---|---|---|---|
| Understand offer and start | Public visitor / High | Medium | High | High | 01–06, 16–17, 23, 35 | Public story is strong; account start is Blocked but guest recovery works. |
| Complete onboarding | New signed-in user / High | Once | High | High | Code only | Blocked by Clerk/profile/database state. |
| Start today's next action | Returning user / High | High | High | High | 25 plus code | Only error recovery reached; successful hierarchy remains Blocked. |
| Continue Qur'an and set a plan | Reader / High | High | Medium–High | High | 12–14, 33–34 | Local progress/plan success covered; connected state Blocked. |
| Read, filter, listen, explain, move next | Reader / High | High | High | High | 07–11, 18–22, 36 | Best-covered core; audio/AI/bookmark success Blocked. |
| Complete hifz review | Memorizer / High | High | High | High | 24 plus code | Unauthorized state covered; session and completion Blocked. |
| Follow a guided dua | Reader / Medium–High | Medium | Medium | Medium | 26–27 | Module and step Runtime; reset/custom-deck outcomes not operated. |
| Capture and recover a private note | Reflective user / Medium–High | Medium | Critical | High | 28, 37–38 plus code | Local save/reload was completed and failed: the saved note disappeared. Account sync/delete remain Blocked or not operated. |
| Ask a sourced Qur'an question | Learning user / Medium–High | Medium | High trust risk | High | 04, 11, 30–31 | Marketing sample and validation/error covered; successful sourced answer Blocked. |
| Track daily worship | Returning user / Medium | Medium | High | Medium | 29 | Only Unauthorized state reached. |
| Adjust app preferences | Any returning user / Medium | Low–Medium | Medium | Medium | 02, 08, 19–20, 23, 32 plus code | Theme/reader settings/localization covered selectively; account settings Blocked. |
| Practice and fluency repair | Memorizer / High | Medium | High | High | Code only | Blocked by auth/data/microphone path. |
| Get help or manage billing | Account holder / Medium | Low | High when needed | High | Code only | Blocked by auth/Paddle state. |

## State coverage matrix

| State | Runtime evidence | Code evidence | Coverage note |
|---|---|---|---|
| Default/happy visual state | 01–04, 07–08, 12–13, 17–23, 26–28, 32–35 | Yes | “Happy” means visually loaded, not necessarily persisted/signed in. |
| Success/confirmation | 14, 37 | Toast provider and several mutations | Reading-plan save persisted in-session; journal explicitly reported device save before the reload failure in 38. |
| Persistence failure/data loss | 37–38 | Profile hydration and local-owner clearing path | Confirmed for the tested local journal path; production frequency and account-sync behavior are unknown. |
| Form validation | 09, 30 | Reader input and AI assistant logic | Native numeric validation and assistant minimum-question message; no full form suite. |
| Empty/first use | 12, 28, 30 | Multiple feature clients | Zero reading state, blank journal draft, empty AI prompt. |
| Disabled/permission boundary | 07–08, 18–22 | Anonymous bookmark/filter persistence gates | No microphone permission test. |
| Unavailable/integration error | 10–11, 31 | Audio, AI, Quran.com clients | Working integration state Blocked. |
| Unauthorized/auth recovery | 05–06, 24–25, 29 | Proxy, layouts, route clients | Inconsistent quality captured; no expired live Clerk session. |
| Loading/pending | None accepted | Route loading components and client pending states | Too fast locally / integration blocked; requires controlled delay. |
| No results | None accepted | Reader no-results implementation | Not directly exercised. |
| Destructive confirmation/undo | Destructive controls visible at 27–28 | Handlers confirm no guard | Action was not triggered to avoid data loss; code establishes missing safeguard. |
| Offline/slow network | None | Some generic retries and load states | Not tested. |
| Motion/reduced motion | None | Framer Motion and CSS present | Not tested. |

## Device, theme, language, input, and accessibility-risk coverage

| Dimension | Covered | Evidence | Limit |
|---|---|---|---|
| Desktop | Yes | 01–14, 16, 23–31, 37–38 | One desktop viewport; no ultrawide or small laptop sweep. |
| Compact 390 CSS px | Yes | 17–21, 32–34 | Responsive audit frame; no physical touch/browser chrome. |
| Tablet 768 CSS px | Yes, representative reader only | 22 | One route and fixed height. |
| Reflow 320 CSS px | Yes | 35–36 | Landing and reader sample only; not equivalent to full 200 percent zoom process. |
| Light mode | Yes | Most screenshots | Full-route contrast not measured. |
| Dark mode | Landing only | 02 | App shell, reader, errors, and forms not captured in dark mode. |
| LTR English | Yes | Most screenshots | Full copy/localization review out of scope. |
| RTL/Urdu selection | Landing only | 23 | Revealed document-language mismatch; no full translated journey. |
| Qur'anic Arabic run | Reader | 07, 11, 21, 36 | Visual shaping only; no specialist typography or screen-reader test. |
| Keyboard | First focus only | 16; 19 shows focus on reader settings after interaction | No complete focus-order, trapping, shortcut, or keyboard-only task run. |
| Screen reader | No | DOM/AX structure inspected selectively | NVDA/JAWS/VoiceOver/TalkBack not run. |
| Touch and target size | Visual risk review only | 18–22, 32–36 | No physical touch; dimensions not comprehensively measured. |
| Contrast | Visual risk review only | All | No computed contrast audit; no conformance conclusion. |

## Authentication and integration blockers

| Blocker | What it prevented | Evidence | Smallest unblock |
|---|---|---|---|
| Clerk not configured | Real sign-in/sign-up, onboarding, expired-session handling | 05–06 | Non-production Clerk keys and disposable test user. |
| No seeded authenticated profile/database | Dashboard happy path, Hifz queue, practice, fluency, trackers, reminders, milestones | 24–25, 29 | Disposable Postgres database plus documented seed/reset script. |
| Quran.com OAuth/content credentials absent | Linked resume, bookmark/collection/note sync, official enrichment and fallback audio | 07–11 | Test OAuth user/scopes and test-safe content credentials. |
| AI gateway absent | Successful cited ayah explanation and broad Ask Qur'an answer | 11, 31 | Test worker URL/token and known deterministic prompts. |
| Local/official audio absent | Playback, buffering, speed/repeat, failover, persistent mini-player | 10, 21, 36 | Known-good test audio base or Quran.com reciter fixture. |
| Paddle/auth state absent | Upgrade, purchase, manage, receipt and failure flow | None | Sandbox Paddle token and disposable buyer/test subscription. |
| No physical device or assistive tech run | Real touch ergonomics, browser chrome/safe-area behavior, screen-reader output | Responsive frame evidence | iOS Safari + Android Chrome and NVDA/VoiceOver/TalkBack checklist. |

## Screenshot manifest

Health labels:

- **Accepted:** visually stable evidence for the named state.
- **Accepted—limited:** valid for the named observation, with an explicit crop/frame/transient limitation.
- **Rejected/unreferenced:** retained in the folder but should not support a finding.

| Step | File | Description | Health |
|---:|---|---|---|
| 01 | [01-landing-desktop-hero.jpg](screenshots/01-landing-desktop-hero.jpg) | Light desktop landing hero, positioning, primary and secondary actions | Accepted |
| 02 | [02-landing-desktop-dark.jpg](screenshots/02-landing-desktop-dark.jpg) | Dark desktop landing hero | Accepted |
| 03 | [03-landing-routine-desktop.jpg](screenshots/03-landing-routine-desktop.jpg) | Guided routine: read, retain, reflect | Accepted |
| 04 | [04-landing-guidance-desktop.jpg](screenshots/04-landing-guidance-desktop.jpg) | Trusted-guidance marketing sample with labels and source framing | Accepted |
| 05 | [05-login-auth-unavailable-desktop.jpg](screenshots/05-login-auth-unavailable-desktop.jpg) | Sign-in unavailable with reader and landing alternatives | Accepted |
| 06 | [06-signup-auth-unavailable-desktop.jpg](screenshots/06-signup-auth-unavailable-desktop.jpg) | Account creation unavailable with persistence explanation | Accepted |
| 07 | [07-reader-anonymous-desktop.jpg](screenshots/07-reader-anonymous-desktop.jpg) | Anonymous compact reader desktop entry | Accepted |
| 08 | [08-reader-settings-desktop.jpg](screenshots/08-reader-settings-desktop.jpg) | Expanded reader settings and persistence boundary | Accepted |
| 09 | [09-reader-filter-validation-desktop.jpg](screenshots/09-reader-filter-validation-desktop.jpg) | Out-of-range global ayah ID and browser-native validation | Accepted |
| 10 | [10-reader-audio-unavailable-desktop.jpg](screenshots/10-reader-audio-unavailable-desktop.jpg) | Audio failure exposes truncated configuration names | Accepted |
| 11 | [11-reader-ai-unavailable-desktop.jpg](screenshots/11-reader-ai-unavailable-desktop.jpg) | Per-ayah AI unavailable state with Retry | Accepted |
| 12 | [12-quran-home-progress-desktop.jpg](screenshots/12-quran-home-progress-desktop.jpg) | Qur'an hub zero progress, Khatmah rank and spiritual title | Accepted |
| 13 | [13-quran-reading-plan-desktop.jpg](screenshots/13-quran-reading-plan-desktop.jpg) | Reading-plan presets, target and local-save action | Accepted |
| 14 | [14-quran-plan-saved-feedback-desktop.jpg](screenshots/14-quran-plan-saved-feedback-desktop.jpg) | Dismissible Plan saved toast | Accepted |
| 15 | [15-landing-zoom-reflow-crop.jpg](screenshots/15-landing-zoom-reflow-crop.jpg) | File name implies reflow, but image is effectively another desktop landing view | Rejected/unreferenced; do not use as zoom/reflow evidence |
| 16 | [16-landing-keyboard-skip-focus.jpg](screenshots/16-landing-keyboard-skip-focus.jpg) | Visible focused Skip to main content link | Accepted—limited to focus evidence; transformed/cropped page is not layout evidence |
| 17 | [17-landing-mobile-390.jpg](screenshots/17-landing-mobile-390.jpg) | Landing at 390 CSS pixels with stacked actions | Accepted—limited; audit-frame chrome visible |
| 18 | [18-reader-mobile-390.jpg](screenshots/18-reader-mobile-390.jpg) | Reader entry and six-item fixed mobile bar at 390 CSS pixels | Accepted—limited; audit-frame label visible |
| 19 | [19-reader-settings-mobile-390.jpg](screenshots/19-reader-settings-mobile-390.jpg) | Reader settings expanded with visible focus and fixed bar | Accepted—limited; framed viewport |
| 20 | [20-reader-controls-mobile-390.jpg](screenshots/20-reader-controls-mobile-390.jpg) | Reader settings chips, form controls and save boundary at 390 CSS pixels | Accepted—limited; framed viewport |
| 21 | [21-reader-content-mobile-390.jpg](screenshots/21-reader-content-mobile-390.jpg) | Reader audio/content controls and fixed-nav overlap at 390 CSS pixels | Accepted—limited; framed viewport |
| 22 | [22-reader-tablet-768.jpg](screenshots/22-reader-tablet-768.jpg) | Reader at 768 CSS pixels with compact/floating navigation | Accepted—limited; framed viewport |
| 23 | [23-landing-urdu-rtl-desktop.jpg](screenshots/23-landing-urdu-rtl-desktop.jpg) | Urdu selected, mirrored layout, largely English content | Accepted |
| 24 | [24-hifz-unauthorized-desktop.jpg](screenshots/24-hifz-unauthorized-desktop.jpg) | Hifz unavailable/Unauthorized and Retry | Accepted |
| 25 | [25-dashboard-auth-error-desktop.jpg](screenshots/25-dashboard-auth-error-desktop.jpg) | Dashboard session error with Retry, Open Qur'an and Help | Accepted |
| 26 | [26-dua-modules-desktop.jpg](screenshots/26-dua-modules-desktop.jpg) | Guided dua module overview | Accepted |
| 27 | [27-dua-guided-module-desktop.jpg](screenshots/27-dua-guided-module-desktop.jpg) | Guided dua step and one-click Reset progress control | Accepted |
| 28 | [28-journal-editor-overlap-desktop.jpg](screenshots/28-journal-editor-overlap-desktop.jpg) | New journal editor, prominent Discard and overlapping new-note action | Accepted |
| 29 | [29-worship-unauthorized-desktop.jpg](screenshots/29-worship-unauthorized-desktop.jpg) | Trackers/Worship Unauthorized and Retry | Accepted |
| 30 | [30-ask-quran-empty-validation-desktop.jpg](screenshots/30-ask-quran-empty-validation-desktop.jpg) | Ask Qur'an empty/minimum-question validation | Accepted |
| 31 | [31-ask-quran-unavailable-desktop.jpg](screenshots/31-ask-quran-unavailable-desktop.jpg) | Ask Qur'an integration-unavailable state | Accepted |
| 32 | [32-settings-mobile-390.jpg](screenshots/32-settings-mobile-390.jpg) | Settings hub category scroller and fixed bar at 390 CSS pixels | Accepted—limited; framed viewport |
| 33 | [33-quran-rank-mobile-390.jpg](screenshots/33-quran-rank-mobile-390.jpg) | Khatmah rank prominence on compact screen | Accepted—limited; framed viewport |
| 34 | [34-quran-rank-badges-mobile-390.jpg](screenshots/34-quran-rank-badges-mobile-390.jpg) | Badge grid, Continue reading and plan transition on compact screen | Accepted—limited; framed viewport |
| 35 | [35-landing-reflow-320.jpg](screenshots/35-landing-reflow-320.jpg) | Landing first screen at 320 CSS pixels | Accepted—limited; framed viewport |
| 36 | [36-reader-reflow-320-overlap.jpg](screenshots/36-reader-reflow-320-overlap.jpg) | Reader collision and fixed-nav obstruction at 320 CSS pixels | Accepted—limited; framed viewport |
| 37 | [37-journal-note-saved-desktop.jpg](screenshots/37-journal-note-saved-desktop.jpg) | Journal reports “Note saved” and “saved in this browser” for the persistence probe | Accepted |
| 38 | [38-journal-note-lost-after-reload.jpg](screenshots/38-journal-note-lost-after-reload.jpg) | Same journal route after normal reload; the saved probe is gone and the empty state returns | Accepted |

The red “Issue” pill visible in several desktop screenshots is a Next.js development overlay. It is not part of the Hifzer product interface and is excluded from product findings.

## Critical-workflow completion status

| Critical workflow | Directly completed? | Named blocker or conclusion |
|---|---|---|
| Public landing → account or guest reader | Partially | Guest-reader branch completed; real account branch blocked by Clerk. |
| First-time onboarding → dashboard | No | Blocked by Clerk plus seeded profile/database. |
| Returning dashboard → next action | No | Dashboard recovery state captured; successful daily overview blocked. |
| Qur'an hub → set and save local plan | Yes, local state | Local success captured; account/Quran.com persistence blocked. |
| Anonymous reader → settings/validation/content navigation | Yes, representative | Audio, AI, bookmark persistence, and full no-results state remain blocked/not covered. |
| Hifz queue → attempt → feedback → completion | No | Unauthorized state captured; auth/data/microphone path blocked. |
| Dua module → guided step | Yes, representative | Progress reset and custom deck outcomes not operated. |
| Journal capture → save/reopen | Yes, and failed | The local note was created and reported saved (37), then disappeared after reload (38). This is a Critical release-blocking conclusion for the tested path. |
| Journal account sync/conflict recovery | No | Blocked by Clerk, database, and a disposable authenticated profile. |
| Ask Qur'an → cited answer → source open/report | No | Validation and unavailable state captured; AI gateway blocked. |
| Settings/account/Quran.com/reminders | No | Hub captured on compact screen; authenticated/integration detail paths blocked. |

## Final evidence statement

The audit has strong evidence for public, anonymous-reader, local Qur'an-plan, guided-dua, journal save/reload failure, selected settings, compact-layout, theme, keyboard-entry, and RTL-selection behavior. It has named blockers for authenticated onboarding, dashboard, hifz, practice/fluency, trackers, live audio, successful AI, Quran.com sync, billing, and account-synced journal/bookmark workflows. “Accessible” here means reachable in the audit environment, not accessibility-conformant. No unsupported happy-path or WCAG-conformance claim should be added downstream.
