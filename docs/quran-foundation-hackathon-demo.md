# Quran Foundation Hackathon Demo

Use the current Hifzer product, not a separate hackathon-only branch.

## Demo Goal

Show Hifzer as a Qur'an-centered retention product that uses:

- Quran.com account linking and bookmark sync
- official Quran.com content enrichment
- official Quran.com audio and reciters
- grounded AI explanation through Quran MCP

Keep the demo focused on one believable reader flow instead of trying to show every feature in the app.

## Recommended Demo Path

1. Open `/settings/quran-foundation` or show the optional Quran.com link card from onboarding completion.
2. Show the linked Quran.com state or connect flow.
3. Trigger `Sync local bookmarks` or `Import Quran.com bookmarks`.
4. Open `/dashboard`.
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

- Quran Foundation user API usage through account linking and bookmark sync
- Quran Foundation content API usage through official reader enrichment, tafsir selection, and reciter/audio access
- Quran MCP usage in a real end-user flow, not a separate demo widget
- Hifzer is a real product surface, not a thin wrapper around one API

## Important Framing

- The current product is broader than hifz alone, but the hackathon demo should stay Qur'an-first.
- Do not bring back outdated `/today` references in the demo script.
- If time is short, prioritize:
1. Quran.com link state
2. official reader tafsir or reciter
3. AI explain
4. bookmark sync state
