# Docs Index

This folder contains a mix of current runbooks and historical audits.

## Read These First

If you are an engineer or coding agent trying to understand the current product, start in this order:

1. `../AGENTS.md`
2. `../README.md`
3. `HIFZER_PROJECT_HANDOFF.md`
4. relevant feature runbooks below

## Current Source-Of-Truth Docs

- `HIFZER_PROJECT_HANDOFF.md`
  Current product, architecture, route model, and integration map.
- `ai-gateway-cloudflare-setup.md`
  Current Cloudflare Worker deployment flow for grounded AI.
- `clerk-reset-runbook.md`
  Current auth reset and redirect contract.
- `quran-foundation-hackathon-demo.md`
  Judge/demo-oriented Quran.com and AI flow.
- `r2-first-time-setup.md`
  Audio hosting setup.
- `progress-simulation.md`
  Regression harness for Qur'an and hifz progress simulations.

## Historical Snapshots

These files are intentionally kept for context, but many of them predate the current super-app pivot, the landing-page rewrite, and the removal of the `/today` route:

- `mobile-ui-audit-report.md`
- `performance-mobile-audit.md`
- `audits/**`

Do not treat those as the current product specification.

## When Docs Conflict

Use this priority order:

1. current code
2. `AGENTS.md`
3. root `README.md`
4. `HIFZER_PROJECT_HANDOFF.md`
5. feature-specific runbooks
6. historical audits
