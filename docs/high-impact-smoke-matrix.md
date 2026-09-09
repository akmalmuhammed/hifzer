# High-impact release smoke matrix

Run this matrix after database migrations and before promoting a deployment. Use a fresh signed-out browser, a free
account, and a paid test account. Never paste real journal text into staging.

## Automated gates

| Gate | Command | Pass condition |
| --- | --- | --- |
| Unit and contract tests | `pnpm test` | All tests pass; environment-dependent suites may be explicitly skipped. |
| Lint and encoding | `pnpm lint:ci` | No lint or text-encoding findings. |
| Production compile | `pnpm build` | Prisma generation, TypeScript, and Next.js build succeed. |
| High-impact browser flow | `pnpm test:e2e:high-impact` | 320/390 px public checks pass; Clerk-backed checks pass when auth test credentials are present. |
| Mobile route overflow | `pnpm audit:mobile:overflow` | No horizontal overflow; generated route report has no offenders. |

For an already-running local or staging deployment, set `PLAYWRIGHT_BASE_URL` to its origin and set
`PLAYWRIGHT_EXTERNAL_SERVER=1`; the test runner will not start another Next.js process.

## Staging roles and data

| Persona | Required state | Never use |
| --- | --- | --- |
| Signed out | Fresh browser profile | Personal reflections or production credentials |
| Free account | Onboarding complete, Quran cursor set, one due Hifz item | A real customer account |
| Paid account | Active `PREMIUM_LIFETIME` test entitlement | A live Paddle card outside approved sandbox testing |
| Offline account | Free account with one locally buffered session and journal mutation | Browser storage shared with another tester |

## Manual journey matrix

| Area | Happy path | Failure/recovery path | Required evidence |
| --- | --- | --- | --- |
| Dashboard | Recommended next action is first and matches open session, due review, then Quran resume precedence. | Expired session returns a sign-in action; retry restores summary. Activity appears immediately after writes. | Desktop + 390 px screenshots and response status. |
| Quran reader | Compact mode has readable Arabic, 44 px controls, working text size, audio, bookmark, previous/next. | Block audio request; safe message offers retry, reciter settings, and text reading. No provider detail is shown. | 320 and 390 px screenshots; keyboard focus trace. |
| Hifz | Complete a session and confirm dashboard review/activity updates. | Go offline before completion; session is buffered, then syncs once online without duplication. | Network log and before/after activity count. |
| Journal | Save, reload, edit while offline, reconnect, and confirm verified account save. | Force a conflict and choose a resolution; discard/reset actions require confirmation. | Exact non-sensitive test fixture restored after reload. |
| Dua | Move through a module and record repetitions. | Reset shows the precise local consequence and offers Cancel before Confirm. | 390 px screenshot. |
| Auth | Sign in and return to the intended internal destination. | Expire auth while dashboard/session is open; recovery goes to sign-in with a safe internal redirect. | Final URL and visible recovery copy. |
| AI | Ask a Quran question and open listed sources. | Block/timeout upstream; no raw diagnostic appears, retry works, Quran remains available, report link is present. | UI capture and sanitized response payload. |
| Billing | Complete a Paddle sandbox transaction; thank-you polls until premium is verified. Duplicate webhook remains idempotent. | Delay webhook, then retry status. Approve full refund/chargeback and confirm entitlement revokes; reversal restores it. | Transaction ID, entitlement row status, account plan. |
| Privacy | Signed-out note remains device-only; signed-in note saves to Hifzer. Explicit Quran.com export is required for reflection text. | Disconnect Quran.com; journal remains intact. Analytics contains only schema-approved coarse dimensions. | Storage destination copy and sanitized analytics payload. |
| Accessibility | Navigate shell, dialogs, reader, and reset confirmation with keyboard; current nav and progress semantics announce correctly. | At 200% zoom and 320 px, focus is not hidden behind mobile nav and dialogs return focus. | Screen-reader notes plus focus screenshots. |

## Promotion rule

Do not promote when any data-loss, entitlement, auth-recovery, raw-error disclosure, focus obstruction, or 320/390 px
overflow check fails. Record lower-severity visual deltas in `design-qa.md` with an owner and follow-up date.
