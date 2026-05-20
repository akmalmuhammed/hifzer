# Mobile UI Audit Report

Generated: 2026-05-18T15:01:37.755Z

Base URL: `https://www.hifzer.com`

## Route Matrix

| Route | Surface | 360px overflow | 414px overflow | 360 CTA | 414 CTA | 360 installability | 414 installability | Final path (360) | Final path (414) |
| --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- |
| `/` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/` | `/` |
| `/welcome` | public | 0px | 0px | hidden | hidden | manifest | manifest | `/` | `/` |
| `/compare` | public | 0px | 0px | hidden | hidden | manifest | manifest+sw | `/compare` | `/compare` |
| `/changelog` | public | 0px | 0px | hidden | hidden | manifest | manifest+sw | `/changelog` | `/changelog` |
| `/quran-preview` | public | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/quran-preview` | `/quran-preview` |
| `/legal` | public | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/legal` | `/legal` |
| `/legal/privacy` | public | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/legal/privacy` | `/legal/privacy` |
| `/legal/terms` | public | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/legal/terms` | `/legal/terms` |
| `/login` | auth | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login` | `/login` |
| `/signup` | auth | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/signup` | `/signup` |
| `/forgot-password` | auth | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login` | `/login` |
| `/hifz` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fhifz` | `/login?redirect_url=%2Fhifz` |
| `/session` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsession` | `/login?redirect_url=%2Fsession` |
| `/quran` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fquran` | `/login?redirect_url=%2Fquran` |
| `/quran/bookmarks` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fquran%2Fbookmarks` | `/login?redirect_url=%2Fquran%2Fbookmarks` |
| `/quran/glossary` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fquran%2Fglossary` | `/login?redirect_url=%2Fquran%2Fglossary` |
| `/quran/juz/1` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fquran%2Fjuz%2F1` | `/login?redirect_url=%2Fquran%2Fjuz%2F1` |
| `/quran/read` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fquran%2Fread` | `/login?redirect_url=%2Fquran%2Fread` |
| `/quran/surah/1` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fquran%2Fsurah%2F1` | `/login?redirect_url=%2Fquran%2Fsurah%2F1` |
| `/dashboard` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fdashboard` | `/login?redirect_url=%2Fdashboard` |
| `/practice` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fpractice` | `/login?redirect_url=%2Fpractice` |
| `/milestones` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fmilestones` | `/login?redirect_url=%2Fmilestones` |
| `/notifications` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fnotifications` | `/login?redirect_url=%2Fnotifications` |
| `/settings` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsettings` | `/login?redirect_url=%2Fsettings` |
| `/settings/account` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsettings%2Faccount` | `/login?redirect_url=%2Fsettings%2Faccount` |
| `/settings/display` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsettings%2Fdisplay` | `/login?redirect_url=%2Fsettings%2Fdisplay` |
| `/settings/language` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsettings%2Flanguage` | `/login?redirect_url=%2Fsettings%2Flanguage` |
| `/settings/plan` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsettings%2Fplan` | `/login?redirect_url=%2Fsettings%2Fplan` |
| `/settings/quran-foundation` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsettings%2Fquran-foundation` | `/login?redirect_url=%2Fsettings%2Fquran-foundation` |
| `/settings/reciter` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsettings%2Freciter` | `/login?redirect_url=%2Fsettings%2Freciter` |
| `/settings/reminders` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsettings%2Freminders` | `/login?redirect_url=%2Fsettings%2Freminders` |
| `/support` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fsupport` | `/login?redirect_url=%2Fsupport` |
| `/roadmap` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Froadmap` | `/login?redirect_url=%2Froadmap` |
| `/fluency` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Ffluency` | `/login?redirect_url=%2Ffluency` |
| `/fluency/lesson/1` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Ffluency%2Flesson%2F1` | `/login?redirect_url=%2Ffluency%2Flesson%2F1` |
| `/fluency/retest` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Ffluency%2Fretest` | `/login?redirect_url=%2Ffluency%2Fretest` |
| `/billing/manage` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fbilling%2Fmanage` | `/login?redirect_url=%2Fbilling%2Fmanage` |
| `/billing/success` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fbilling%2Fsuccess` | `/login?redirect_url=%2Fbilling%2Fsuccess` |
| `/billing/upgrade` | app | 0px | 0px | hidden | hidden | manifest+sw | manifest+sw | `/login?redirect_url=%2Fbilling%2Fupgrade` | `/login?redirect_url=%2Fbilling%2Fupgrade` |

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
