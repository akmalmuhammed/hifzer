# Docs Index

This folder contains both current runbooks and older audit snapshots.

## Read These First

If you are an engineer or coding agent trying to understand the current product, read in this order:

1. `../AGENTS.md`
2. `../README.md`
3. `HIFZER_PROJECT_HANDOFF.md`
4. `operational-troubleshooting.md`
5. the feature-specific runbook for the system you are touching

## Current Source-Of-Truth Docs

- `HIFZER_PROJECT_HANDOFF.md`
  Current product shape, route model, integration map, and operational truths.
- `operational-troubleshooting.md`
  First-response runbook for auth, dashboard, Quran.com, AI, audio, and deploy issues.
- `ai-gateway-cloudflare-setup.md`
  Current Cloudflare Worker deployment flow for grounded Qur'an AI.
- `clerk-reset-runbook.md`
  Current Clerk reset and redirect contract.
- `r2-first-time-setup.md`
  Local audio bucket setup and verification.
- `quran-foundation-hackathon-demo.md`
  Judge/demo-oriented Quran.com and AI flow.
- `quran-foundation-hackathon-top3-audit.md`
  Top-3 hackathon audit, feature map, scope request, and submission strategy.
- `progress-simulation.md`
  Regression harness for Qur'an and hifz progress simulations.

## Current Supporting References

- `../src/hifzer/quran/data/SOURCES.md`
  Checked-in Qur'an data provenance.
- `../workers/ai-gateway/README.md`
  Worker-level env, request flow, and verification notes.

## Historical Snapshots

These files are intentionally kept for context, but many predate the current dashboard-first app structure, the removal of `/today`, and the broader Qur'an companion positioning:

- `mobile-ui-audit-report.md`
- `performance-mobile-audit.md`
- `audits/**`

Do not treat those as the current product specification or current operational runbook.

## When Docs Conflict

Use this priority order:

1. current code
2. `AGENTS.md`
3. root `README.md`
4. `HIFZER_PROJECT_HANDOFF.md`
5. `operational-troubleshooting.md`
6. feature-specific runbooks
7. historical audits
