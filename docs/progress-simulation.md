# Progress Simulation

Hifzer now has dedicated progress simulation harnesses for regression testing:

```bash
npm run test:progress:week
npm run test:progress:14d
npm run test:progress:failures
```

What it does:

- creates an isolated Prisma schema from `TEST_DATABASE_URL`
- boots the app schema in that schema only
- creates one synthetic user
- simulates 7 consecutive days of:
  - Qur'an reader progress (`READER_VIEW`)
  - browse audio progress (`AUDIO_PLAY`)
  - Hifz start + completion through the real session engine
- verifies:
  - streak reaches 7 days
  - Qur'an unique ayah count reaches 56
  - Qur'an cursor reaches ayah `63`
  - Hifz sessions complete successfully
  - Hifz cursor and Qur'an cursor remain separated

The 14-day harness additionally verifies:

- streak reaches 14 days
- Qur'an unique ayah count reaches 112
- recurring Hifz weekly validation runs appear
- weekly validation sessions include real `WEEKLY_TEST` steps
- weekly validation outcomes pass for a strong recitation path

The failure-path harness verifies:

- warmup failure blocks new Hifz progression
- weekly validation failure blocks new Hifz progression and writes a failed weekly gate run
- missing several days triggers `CATCH_UP` mode with no new ayahs
- returning after missed days still allows recovery sessions and preserves Qur'an/Hifz lane separation

Environment requirements:

- `TEST_DATABASE_URL`
- optional `TEST_SCHEMA` is not required; the test creates a unique schema per run

The harness does not touch the production `hifzer` schema.
