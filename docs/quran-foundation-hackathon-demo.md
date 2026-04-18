# Quran Foundation Hackathon Demo

Use the current Hifzer product, not a separate hackathon-only branch.

## Demo Goal

Show Hifzer as a Qur'an-centered retention product that uses:

- Quran.com account linking and visible dashboard sync state
- Quran.com bookmark, collection, note, reading-session, activity-day, streak, and goal surfaces
- official Quran.com content enrichment
- official Quran.com audio and reciters
- grounded AI explanation through Quran MCP

Keep the demo focused on one believable reader flow instead of trying to show every feature in the app.

## Pre-demo Check

For the judge account, open `/dashboard` first and confirm the `Connected Quran` card is healthy.

If the card says `Refresh permissions`, reconnect Quran.com before recording. Older links may only have `bookmark` and `user` scopes; the strongest demo needs the newer goal, streak, reading-session, collection, activity-day, and note permissions.

## Recommended Demo Path

1. Open `/dashboard`.
2. Show the `Connected Quran` card:
   - Quran.com connection state
   - Content API readiness
   - resume point
   - streak or goal state
   - collections and notes
3. If permissions are stale, use `Refresh permissions` before recording the final demo.
4. Open `/settings/quran-foundation` only if you need to show bookmark import, collection sync, or note import explicitly.
5. Use the dashboard to continue into the Qur'an lane.
6. Open `/quran/read?view=compact`.
7. Open reader filters and show:
   - translation toggle
   - tafsir toggle
   - official tafsir dropdown
   - Quran.com action dropdown
8. Open reciter settings or use an official Quran.com reciter in the reader to show the audio layer is not only local files.
9. Move between ayahs and show official tafsir loading for the current ayah.
10. Trigger `Explain this ayah`.
11. Show the simplified AI card:
    - explanation insights
    - tafsir insights
    - word notes
12. Save a bookmark from the reader.
13. Open `/quran/bookmarks` and show provider/sync state.
14. Finish in `/journal` to show how reflections stay inside Hifzer while the reading and bookmark layer connects to Quran.com.

## What This Proves

- Quran Foundation user API usage through account linking, bookmark sync, collections, notes, reading sessions, activity days, streaks, and goals
- Quran Foundation content API usage through official reader enrichment, tafsir selection, and reciter/audio access
- Quran MCP usage in a real end-user flow, not a separate demo widget
- Hifzer is a real product surface, not a thin wrapper around one API

## Important Framing

- The current product is broader than hifz alone, but the hackathon demo should stay Qur'an-first.
- Do not bring back outdated `/today` references in the demo script.
- Start from `/dashboard`; do not bury the Quran.com story in settings unless you are showing a specific sync action.
- If time is short, prioritize:
1. dashboard `Connected Quran` state
2. official reader tafsir or reciter
3. AI explain
4. bookmark sync state
