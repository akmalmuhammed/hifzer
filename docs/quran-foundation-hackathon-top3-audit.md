# Quran Foundation Hackathon Top-3 Audit

Last updated: 2026-04-19

Source brief: https://launch.provisioncapital.com/quran-hackathon

Supporting docs checked:

- https://api-docs.quran.foundation/
- https://api-docs.quran.foundation/docs/user_related_apis_versioned/scopes/
- `AGENTS.md`
- `README.md`
- `docs/HIFZER_PROJECT_HANDOFF.md`
- `docs/quran-foundation-hackathon-demo.md`
- Current route and domain code under `src/app`, `src/components`, `src/hifzer`, and `workers/ai-gateway`

## Executive Verdict

Hifzer can credibly compete for top 3, but only if the submission is framed as a Quran.com-connected retention loop instead of a broad feature tour.

The product already has the raw pieces the hackathon wants:

- Content API usage through official translation, tafsir, recitation catalog, and audio sources.
- User API usage through Quran.com OAuth, bookmarks, collections, reading sessions, activity days, and note plumbing.
- Quran MCP usage through grounded AI ayah explanation and broader assistant routes.
- A differentiated retention engine around dashboard, reading continuity, hifz SRS, journaling, dua, practice, and fluency.

The main top-3 risk is proof. Judges should see the API depth and user impact in one guided path within 90 seconds. Today that proof is split across `/dashboard`, `/quran`, `/quran/read`, `/quran/bookmarks`, `/journal`, `/assistant`, and `/settings/quran-foundation`.

## Hackathon Requirements Map

The hackathon requires at least one API from each category.

| Requirement | Current Hifzer Coverage | Evidence | Readiness |
| --- | --- | --- | --- |
| Content API or Quran MCP | Official reader enrichment, tafsir resources, reciter catalog, Quran.com audio, MCP-grounded AI explanation | `src/hifzer/quran-foundation/content.ts`, `src/app/api/quran/content-panel/route.ts`, `src/app/api/quran/audio-source/route.ts`, `workers/ai-gateway/src/index.ts`, `src/app/api/quran/ai-explain/route.ts` | Strong |
| User API | OAuth account linking, bookmark sync, collection export, reading session writeback, activity-day writeback, note import/sync code paths | `src/hifzer/quran-foundation/server.ts`, `src/hifzer/quran-foundation/user-features.ts`, `src/hifzer/quran-foundation/bookmarks.ts`, `src/app/api/quran-foundation/*` | Strong but scope-sensitive |
| Submission demo | Demo runbook exists | `docs/quran-foundation-hackathon-demo.md` | Good, needs sharper top-3 story |
| API usage description | Partly documented | `README.md`, `docs/quran-foundation-hackathon-demo.md` | Needs final submission wording |

Eligibility risk: `src/hifzer/quran-foundation/config.ts` currently requests `openid`, `offline_access`, `bookmark`, `user`, `activity_day`, `reading_session`, and `collection`. The app code supports `note`, `streak`, and `goal` read surfaces, but those scopes are not currently requested. This means judges may see "Read access pending" for the strongest dashboard stats unless the OAuth client is approved and the requested scopes are updated.

## Judging Score Estimate

| Category | Points | Current Estimate | Top-3 Target | Gap |
| --- | ---: | ---: | ---: | --- |
| Impact on Quran Engagement | 30 | 23-25 | 28+ | Make the habit loop obvious: reconnect after Ramadan, read, understand, save, reflect, return tomorrow. |
| Product Quality and UX | 20 | 15-17 | 18+ | Reduce demo friction. Add an obvious hackathon-ready connected journey entry point. |
| Technical Execution | 20 | 16-18 | 19 | Verify deployment, envs, OAuth scopes, AI gateway, sync paths, and mobile flow before recording. |
| Innovation and Creativity | 15 | 11-13 | 14+ | Lead with "Connected Quran memory layer" plus grounded AI reflection, not generic reader features. |
| Effective API Use | 15 | 12-13 | 15 | Show Content API, User API, and MCP in one continuous interaction with visible provider state. |

Current likely score: 77-86.

Top-3 target score: 94+.

## Feature Map

### 1. Connected Quran Return Loop

| User moment | Existing surface | Current capability | Hackathon value |
| --- | --- | --- | --- |
| Start today | `/dashboard` | Connected Quran card, Hifzer streak, review health, quick actions | Strong impact entry point |
| Connect Quran.com | `/api/quran-foundation/connect`, `/settings/quran-foundation`, dashboard card | OAuth, scopes, status, reconnect handling | Satisfies User API and trust story |
| Resume reading | `/quran`, `/quran/read?view=compact` | Cursor, compact reader, reader preferences, progress sync | Shows lasting post-Ramadan continuity |
| Sync reading | `/api/quran/progress/track` | Local read progress plus reading session and activity-day sync | Differentiated User API usage |
| Learn from ayah | Compact reader | Translation, phonetics, official tafsir, AI explanation | Deepens understanding |
| Save memory | Reader bookmark control, `/quran/bookmarks` | Smart local bookmark, offline queue, Quran.com sync state | Shows personalization and sync |
| Reflect | `/journal` | Ayah-linked journal, AI reflection prompt, Quran.com note import/sync code path | Turns explanation into retention |

Top-3 request: make this loop explicit as "Read -> Understand -> Save -> Reflect -> Return" in the app and demo.

### 2. Official Content Layer

| Existing feature | Code | Status | Top-3 move |
| --- | --- | --- | --- |
| Content auth and resource catalogs | `src/hifzer/quran-foundation/content.ts` | Strong | Mention client credentials and content scope in submission. |
| Official translation resources | `getQuranFoundationContentCatalog` | Strong | Surface one selected official translation during demo. |
| Official tafsir resources | `CompactOfficialTafsir`, `content-panel` API | Strong | Use tafsir as the visible "official source" before AI. |
| Official reciters and audio fallback | `getQuranFoundationRecitationCatalog`, `audio-source` API, reciter settings | Good | Pick a Quran.com reciter in demo account settings. |
| Standalone content panel | `src/components/quran/quran-foundation-content-panel.tsx` | Implemented but not used in current reader path | Either remove from story or intentionally expose where it helps. |

### 3. Grounded AI Layer

| Existing feature | Code | Status | Top-3 move |
| --- | --- | --- | --- |
| Ayah explanation | `src/components/quran/ayah-ai-explanation-panel.tsx` | Strong | Show after official tafsir so it feels grounded, not magical. |
| Worker grounding | `workers/ai-gateway/src/index.ts` | Strong | State: Quran MCP provides verified material, model formats only after grounding. |
| Quran assistant | `/assistant`, `quran-ai-assistant-panel` | Good but separate | Use only if the 2-3 minute video has time. Do not distract from reader loop. |
| Journal reflection prompt | AI panel to journal link | Strong | This is the emotional close. Show one saved reflection. |

### 4. Retention Engine Around Quran Reading

| Existing feature | Surface | Status | Top-3 move |
| --- | --- | --- | --- |
| Hifz SRS | `/hifz`, `/hifz/progress` | Strong | Mention as retention engine, but do not make it the core demo unless judges ask. |
| Practice and fluency | `/practice`, `/fluency` | Good support lanes | Use as depth proof in docs/screenshots, not main video. |
| Dua and journal | `/dua`, `/journal` | Strong companion breadth | Frame as "Quran connection beyond a reader." |
| Dashboard overview | `/dashboard` | Strong | Start demo here. This is the product's control room. |

## Critical Gaps To Fix Before Submission

### P0 - OAuth Scope Approval And Requested Scopes

Issue:

The code can read or sync more than the current requested scopes expose. The dashboard checks `streak`, `streak.read`, `goal`, `goal.read`, `note`, and `note.read`, but `QURAN_FOUNDATION_REQUESTED_USER_SCOPES` does not include `streak`, `goal`, or `note`.

Why it matters:

If the judge account cannot grant these scopes, the best dashboard panels say "Read access pending" and the app looks less integrated than it is.

Request:

- Ask Quran Foundation for approval of `note`, `note.read`, `note.create`, `note.update`, `note.delete`, `streak.read`, `goal.read`, and optionally `preference.read`.
- Once approved, update `src/hifzer/quran-foundation/config.ts` and `src/hifzer/quran-foundation/config.test.ts`.
- Reconnect the demo Quran.com account and verify `/api/quran-foundation/overview`.

Suggested email:

```text
Subject: Quran Foundation Hackathon scope approval request for Hifzer

Assalamu alaikum,

I am submitting Hifzer to the Quran Foundation Hackathon. Hifzer is a Quran-centered companion app focused on helping users keep their post-Ramadan Quran connection through reading continuity, official Quran.com enrichment, grounded AI explanation, bookmarks, and private reflection.

Current app callback:
[production callback URL]

Client ID:
[QF OAuth client ID]

Scopes already used:
openid, offline_access, bookmark, user, activity_day, reading_session, collection

Additional scopes requested for the hackathon demo:
note, note.read, note.create, note.update, note.delete, streak.read, goal.read, preference.read

Why:
- note scopes let users save ayah-linked reflections from Hifzer into the Quran.com note layer.
- streak.read and goal.read let Hifzer show Quran.com continuity state on the dashboard.
- preference.read would help align Hifzer's reader with the user's Quran.com reading preferences.

Hifzer uses these scopes to build a connected Quran retention loop, not to replace Quran.com identity or content.

Jazakum Allahu khayran.
```

### P0 - One Demo-Ready Connected Flow

Issue:

The product is broad. Breadth can hurt scoring if judges do not immediately understand the central idea.

Request:

Create or stage a single "Hackathon demo account" flow:

1. `/dashboard`: Connected Quran card shows Content API, User API, resume point, activity/streak/goal if approved.
2. `/quran/read?view=compact`: Use Quran.com reciter, official tafsir, translation, bookmark control, AI explanation.
3. Save bookmark: show "Quran.com linked" state.
4. Save reflection: show journal entry linked to the ayah.
5. Return to `/dashboard`: show the reading state changed.

This can be a runbook first. A dedicated `/roadmap` item or in-app "Demo path" banner is optional.

### P1 - Keep Public Positioning Quran-Companion First

Issue:

The current landing page correctly positions Hifzer as a broader Quran companion, but hackathon-specific copy can easily drift back into "hifz tracker" language because the retention engine is so strong.

Request:

For the hackathon submission copy and any judge-facing page, lead with:

"Hifzer helps Muslims keep their Quran connection after Ramadan by joining official Quran.com content, synced Quran.com memory, grounded AI explanation, and a daily retention dashboard."

Do not lead with "hifz tracker." Hifz is a core lane, not the entire product.

### P1 - API Use Needs Visible Attribution

Issue:

The implementation uses official Quran.com layers, but judges may not notice which parts are Quran Foundation APIs.

Request:

Add small, tasteful provider labels where it matters:

- Reader filter: "Official Quran.com tafsir"
- Audio settings: "Quran.com reciter"
- Bookmark panel: "Syncs to Quran.com"
- Dashboard card: "User API: reading sessions, activity days, collections"
- AI panel: "Grounded with Quran MCP"

### P1 - Submission Video Must Avoid Feature Soup

Issue:

Hifzer has many surfaces. A 2-3 minute video cannot show them all.

Request:

Video structure:

1. 0:00-0:20 - Problem: Ramadan connection fades; Hifzer makes return easy.
2. 0:20-0:45 - Dashboard: Quran.com linked, resume point, goal/streak/sync state.
3. 0:45-1:25 - Reader: official tafsir, official reciter/audio, translation, progress sync.
4. 1:25-1:55 - AI: grounded ayah explanation through Quran MCP.
5. 1:55-2:20 - Memory: bookmark sync plus journal reflection.
6. 2:20-2:45 - Why it wins: one loop across Content API, User API, MCP, and retention.

### P2 - Add A Thin Hackathon Submission Page Or Section

Issue:

Judges reviewing asynchronously benefit from a page that explains the build.

Request:

Add a public route such as `/quran-hackathon` or a section in `/roadmap` with:

- one-line product thesis
- demo credentials or demo instructions, if appropriate
- exact API usage map
- privacy note
- technical architecture diagram
- link to the GitHub repo

This route should not become a marketing landing page. It should be a judge aid.

## Recommended Feature Requests

### FR-1: Connected Quran Mission Control

Problem:

Quran.com sync status is split across dashboard, Quran hub, settings, and reader.

Request:

Create a compact, reusable "Connected Quran Mission Control" component used on `/dashboard` and `/quran` that shows:

- connection state
- granted scopes
- Content API readiness
- latest remote reading session
- last local sync write
- bookmark sync count
- collection/note availability
- one action: "Open connected reader"

Acceptance criteria:

- A judge can see Content API and User API readiness without opening settings.
- Missing scopes show one clear reconnect or approval message.
- The component gracefully handles not-configured, disconnected, connected, and degraded states.

### FR-2: Demo Seed And Verification Script

Problem:

Top-3 submissions need reliable demos. Live OAuth, AI, and content APIs introduce many failure modes.

Request:

Add a script/runbook that verifies:

- `/api/quran-foundation/status`
- `/api/quran-foundation/overview`
- `/api/quran/content-panel?ayahId=1`
- `/api/quran/audio-source?ayahId=1&reciterId=[qf-reciter]`
- `/api/quran/ai-explain`
- bookmark save and sync
- journal note sync, if note scope is approved

Acceptance criteria:

- It outputs pass/fail with human-readable remediation.
- It can be run before recording and before final submission.

### FR-3: Reader-To-Reflection Flow

Problem:

The emotional product value is strongest when understanding becomes personal action.

Request:

After AI explanation returns, make "Save reflection to journal" feel like the natural next step:

- prefill with ayah reference
- include the AI reflection prompt
- preserve source attribution
- indicate whether Quran.com note sync is enabled

Acceptance criteria:

- One click from explanation to journal draft.
- Draft clearly shows linked ayah.
- Sync state is visible after save.

### FR-4: Quran.com Preference Bridge

Problem:

The user may already have reading/audio preferences in Quran.com.

Request:

If approved, use `preference.read` to import:

- preferred translation
- preferred reciter/audio style
- reading display preferences where available

Acceptance criteria:

- First Quran.com link can personalize Hifzer's reader.
- User can choose whether to keep Hifzer preferences separate.

### FR-5: Public Hackathon Proof Page

Problem:

Judges need fast technical confidence.

Request:

Create `/quran-hackathon` with:

- product thesis
- API map
- architecture summary
- demo path
- privacy/security summary
- known limitations

Acceptance criteria:

- A judge can understand API use without reading the codebase.
- It links directly to `/dashboard`, `/quran/read?view=compact`, `/quran/bookmarks`, `/journal`, and `/assistant` for signed-in reviewers.

## What Not To Build Before The Deadline

Do not build large new surfaces unless the basics above are already flawless.

Avoid:

- teacher circles, unless already near complete
- a new social layer
- a second AI interface
- a full landing rewrite if the demo path is weak
- gamification that distracts from Quran connection

Top 3 usually rewards one complete, memorable loop over ten half-visible ideas.

## Final Submission Positioning

Project title:

Hifzer - Connected Quran Retention Companion

Short description:

Hifzer helps Muslims maintain their Quran connection after Ramadan by combining a daily return dashboard, official Quran.com enrichment, synced Quran.com reading memory, grounded AI ayah explanation through Quran MCP, smart bookmarks, and private reflection.

Detailed explanation:

Hifzer turns Quran engagement into a repeatable loop: resume from the dashboard, read with official Quran.com content, listen with Quran.com reciters, understand through Quran MCP-grounded explanation, save important ayahs as synced bookmarks, reflect privately in a journal, and return tomorrow with reading progress and review state preserved.

API usage description:

Hifzer uses Quran Foundation Content APIs for official translation, tafsir resources, reciter catalogs, and audio source lookup. It uses Quran Foundation User APIs through OAuth for Quran.com account linking, bookmarks, collections, reading sessions, activity-day sync, and supported note/streak/goal surfaces. It uses Quran MCP in the Cloudflare Worker AI gateway so ayah explanations are grounded in verified Quran material rather than model memory.

One-sentence demo hook:

"Watch one ayah move from official Quran.com reading, to grounded understanding, to synced memory, to private reflection, and back into tomorrow's dashboard."

## Top-3 Checklist

- [ ] Production env has Quran Foundation Content credentials.
- [ ] Production env has Quran Foundation OAuth credentials and encryption secret.
- [ ] Demo Quran.com account is connected with fresh scopes.
- [ ] Scope approval request sent for note, streak, goal, and preference scopes.
- [ ] Dashboard Connected Quran card shows healthy state.
- [ ] Reader official tafsir works.
- [ ] Quran.com reciter/audio works.
- [ ] AI explanation works through deployed Cloudflare Worker.
- [ ] Bookmark save shows linked/synced state.
- [ ] Journal reflection save works.
- [ ] Demo video follows one loop, not every product surface.
- [ ] Submission explains Content API, User API, and MCP usage clearly.
