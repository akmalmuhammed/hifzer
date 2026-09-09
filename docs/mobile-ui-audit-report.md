# Mobile UI Audit Report

Generated: 2026-09-05T15:53:23.356Z

Base URL: `http://localhost:3000`

## Route Matrix

| Route | Surface | 360px overflow | 414px overflow | 360 CTA | 414 CTA | 360 installability | 414 installability | Final path (360) | Final path (414) |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |
| `/` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/` | `/` |
| `/welcome` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/` | `/` |
| `/compare` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/compare` | `/compare` |
| `/changelog` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/changelog` | `/changelog` |
| `/quran-preview` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/quran-preview` | `/quran-preview` |
| `/legal` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/legal` | `/legal` |
| `/legal/privacy` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/legal/privacy` | `/legal/privacy` |
| `/legal/terms` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/legal/terms` | `/legal/terms` |
| `/login` | auth | 0px | 0px | hidden | hidden | manifest | manifest | `/login` | `/login` |
| `/signup` | auth | 0px | 0px | hidden | hidden | manifest | manifest | `/signup` | `/signup` |
| `/forgot-password` | auth | 0px | 0px | hidden | hidden | manifest | manifest | `/forgot-password` | `/forgot-password` |
| `/hifz` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/hifz` | `/hifz` |
| `/session` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/hifz` | `/hifz` |
| `/quran` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran` | `/quran` |
| `/quran/bookmarks` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/bookmarks` | `/quran/bookmarks` |
| `/quran/glossary` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/glossary` | `/quran/glossary` |
| `/quran/juz/1` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/juz/1` | `/quran/juz/1` |
| `/quran/read` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/read` | `/quran/read` |
| `/quran/surah/1` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/surah/1` | `/quran/surah/1` |
| `/dashboard` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/dashboard` | `/dashboard` |
| `/practice` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/login` | `/login` |
| `/milestones` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/login` | `/login` |
| `/notifications` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/login` | `/login` |
| `/settings` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings` | `/settings` |
| `/settings/account` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/account` | `/settings/account` |
| `/settings/display` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/display` | `/settings/display` |
| `/settings/language` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/language` | `/settings/language` |
| `/settings/plan` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/plan` | `/settings/plan` |
| `/settings/quran-foundation` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/quran-foundation` | `/settings/quran-foundation` |
| `/settings/reciter` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/reciter` | `/settings/reciter` |
| `/settings/reminders` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/login` | `/login` |
| `/support` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/support` | `/support` |
| `/roadmap` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/roadmap` | `/roadmap` |
| `/fluency` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/login` | `/login` |
| `/fluency/lesson/1` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/login` | `/login` |
| `/fluency/retest` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/login` | `/login` |
| `/billing/manage` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/billing/manage` | `/billing/manage` |
| `/billing/success` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/billing/thank-you` | `/billing/thank-you` |
| `/billing/upgrade` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/billing/upgrade` | `/billing/upgrade` |

## Offenders

- No overflow offenders detected.

## Add-to-Home Checks

- Top-right compact install control is mounted in app shell (`StreakCornerBadge`) for mobile routes.
- Sticky bottom install banner is feature-flagged (`NEXT_PUBLIC_INSTALL_BANNER_ENABLED=1`).
- This headless audit reports CTA visibility as `hidden` until install eligibility (`beforeinstallprompt`/iOS Safari path) is met.
- iOS path: Share -> Add to Home Screen guidance.
- Android path: `beforeinstallprompt` trigger when browser eligibility is met.

## Manual QA Matrix

| Device/browser | Portrait | Landscape | Notes |
| --- | --- | --- | --- |
| iPhone Safari | Pending | Pending | Validate Share -> Add to Home Screen guidance and safe-area spacing. |
| Android Chrome | Pending | Pending | Validate prompt path from install CTA when eligible. |
| Android Edge | Pending | Pending | Validate CTA visibility and no horizontal blank drag. |

## Reproduction Steps

1. Open app on mobile browser (Safari iOS / Chrome Android).
2. Navigate to `/dashboard`, `/hifz`, `/quran`, and `/quran/bookmarks`.
3. Swipe horizontally left/right while near top and mid-page.
4. Verify no blank canvas is revealed outside page content.
5. Verify install CTA behavior:
   - Android: install prompt opens from CTA when eligible.
   - iOS Safari: install guidance explains Share -> Add to Home Screen.
