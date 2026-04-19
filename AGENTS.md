# AGENTS.md

Read this file first before making product, architecture, or copy assumptions in this repo.

## Product Snapshot

Hifzer is no longer just a narrow hifz prototype.

It is now a Qur'an-centered companion app with multiple connected surfaces:

- daily dashboard and retention overview
- Qur'an hub and reader
- hifz session engine and SRS review
- official Quran.com enrichment and bookmark sync
- grounded AI ayah explanation
- private journal
- dua modules and custom duas
- practice and fluency drills
- milestones, reminders, billing, support, and public marketing pages

The current public positioning is closer to a Qur'an companion / super app than a single-lane hifz tool. Hifz is still important, but it now sits inside a broader product.

## Current Truths

- Post-auth landing is `/dashboard`, not `/today`.
- `/session` is an alias that redirects to `/hifz`.
- The main app shell navigation centers on `/dashboard`, `/hifz`, `/quran`, `/dua`, `/journal`, `/settings`, `/roadmap`, and `/support`.
- The Qur'an reader is one of the deepest surfaces in the app. It supports compact/list modes, saved reader filters, translation/phonetic toggles, official tafsir, AI explanation, smart bookmarks, and Quran.com actions.
- The AI stack currently defaults to Groq plus Quran MCP grounding through the Cloudflare Worker in `workers/ai-gateway`.
- Quran.com linking currently powers bookmark sync and official enrichment. Do not overstate broader user-API usage unless you have added it in code.

## Docs To Read In Order

1. `AGENTS.md`
2. `README.md`
3. `docs/HIFZER_PROJECT_HANDOFF.md`
4. `docs/README.md`
5. Feature-specific runbooks only when relevant

## Do Not Trust Without Verification

These docs are retained for history and audit context, not as source of truth:

- `docs/audits/**`
- `docs/mobile-ui-audit-report.md`
- `docs/performance-mobile-audit.md`

Many of them predate the super-app pivot, the landing-page rewrite, and the removal of the `/today` route.

## Code Map

- `src/app`
  Route groups, layouts, pages, and API handlers.
- `src/hifzer`
  Product/domain logic.
- `src/components`
  Shared UI, app shell, landing sections, Qur'an surfaces, providers, and primitives.
- `workers/ai-gateway`
  Cloudflare Worker for grounded AI explanations.
- `prisma/schema.prisma`
  Persistence model.

## Key Domain Areas

- `src/hifzer/quran`
  Reader, lookup, translations, progress, reader preferences.
- `src/hifzer/srs`
  Hifz queueing and SRS updates.
- `src/hifzer/recitation`
  Practice and fluency intelligence.
- `src/hifzer/bookmarks`
  Smart bookmark state and sync.
- `src/hifzer/journal`
  Private journal persistence and local fallback.
- `src/hifzer/quran-foundation`
  Quran.com account, bookmark sync, content enrichment.
- `src/hifzer/ai`
  Next.js-side AI gateway config and contracts.

## Working Guidance

- Treat Hifzer as a live, growing product, not an MVP scaffold.
- Prefer `code-review-graph` for broad codebase orientation, review impact, and dependency questions before opening many files manually. In a fresh environment, run `pnpm graph:setup` once, then restart Codex so the MCP server is available.
- Prefer current code over older docs when they conflict.
- When editing marketing or product copy, preserve the broader Qur'an companion positioning unless the user asks to shift it again.
- When editing documentation, point future agents toward the current truth docs and clearly mark historical snapshots as archival.
