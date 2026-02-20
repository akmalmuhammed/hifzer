# Mobile UI Audit Report

Generated: 2026-02-20T11:43:43.593Z

Base URL: `http://127.0.0.1:3130`

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
| `/today` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/today` | `/today` |
| `/session` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/session` | `/session` |
| `/quran` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran` | `/quran` |
| `/quran/bookmarks` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/bookmarks` | `/quran/bookmarks` |
| `/quran/glossary` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/glossary` | `/quran/glossary` |
| `/quran/juz/1` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/juz/1` | `/quran/juz/1` |
| `/quran/read` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/read` | `/quran/read` |
| `/quran/surah/1` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/quran/surah/1` | `/quran/surah/1` |
| `/dashboard` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/dashboard` | `/dashboard` |
| `/progress` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/progress` | `/progress` |
| `/progress/map` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/progress/map` | `/progress/map` |
| `/progress/mistakes` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/progress/mistakes` | `/progress/mistakes` |
| `/progress/retention` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/progress/retention` | `/progress/retention` |
| `/progress/transitions` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/progress/transitions` | `/progress/transitions` |
| `/practice` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/practice` | `/practice` |
| `/milestones` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/milestones` | `/milestones` |
| `/notifications` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/notifications` | `/notifications` |
| `/streak` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/streak` | `/streak` |
| `/settings` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings` | `/settings` |
| `/settings/account` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/account` | `/settings/account` |
| `/settings/display` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/display` | `/settings/display` |
| `/settings/plan` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/plan` | `/settings/plan` |
| `/settings/privacy` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/privacy` | `/settings/privacy` |
| `/settings/reciter` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/reciter` | `/settings/reciter` |
| `/settings/reminders` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/reminders` | `/settings/reminders` |
| `/settings/scoring` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/scoring` | `/settings/scoring` |
| `/settings/teacher` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/teacher` | `/settings/teacher` |
| `/settings/thresholds` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/settings/thresholds` | `/settings/thresholds` |
| `/support` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/support` | `/support` |
| `/roadmap` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/roadmap` | `/roadmap` |
| `/fluency` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/fluency` | `/fluency` |
| `/fluency/lesson/1` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/fluency/lesson/1` | `/fluency/lesson/1` |
| `/fluency/retest` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/fluency/retest` | `/fluency/retest` |
| `/billing/manage` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/billing/manage` | `/billing/manage` |
| `/billing/success` | app | 0px | 0px | hidden | hidden | manifest | manifest | `/billing/success` | `/billing/success` |
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
2. Navigate to `/session`, `/today`, `/quran`, and `/quran/bookmarks`.
3. Swipe horizontally left/right while near top and mid-page.
4. Verify no blank canvas is revealed outside page content.
5. Verify install CTA behavior:
   - Android: install prompt opens from CTA when eligible.
   - iOS Safari: install guidance explains Share -> Add to Home Screen.
