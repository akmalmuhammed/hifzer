# Qur'an Data Sources

This folder contains the checked-in runtime data Hifzer uses for its local Qur'an experience.

## Current Runtime Files

- `ayahs.full.json`
  Canonical local ayah dataset used by lookup and reader flows.
- `quran-data.js`
  Tanzil-derived metadata source retained in-repo.
- `surah-index.ts`
  Generated surah index used by local lookup helpers.
- `translations/en.sahih.by-ayah-id.json`
  Saheeh International English translation indexed by global ayah id.

## Provenance

- Arabic text and structural metadata trace back to Tanzil-compatible source material.
- English translation bundle is generated from the Saheeh International source used by the repo tooling.

## Current Regeneration Commands

Regenerate the surah index:

```bash
node scripts/generate-surah-index.mjs
```

Regenerate the Saheeh translation bundle:

```bash
pnpm quran:translation:sahih
```

## Notes

- These files are part of the app's local-first Qur'an experience.
- Official Quran.com enrichment is layered on top through `src/hifzer/quran-foundation`, not by replacing these local files.
- Older seed docs that mention missing `seed:*` package scripts are no longer the best reference for day-to-day work in this repo.
