# Hifzer AI Gateway

Cloudflare Worker for grounded Qur'an AI features.

## Current Role

The Worker powers the `Explain this ayah` flow in the Qur'an reader.

Current live shape:

- Next.js app calls the Worker server-to-server
- Worker grounds the request with Quran MCP
- Worker formats the final explanation through the configured model provider
- provider handling is pluggable
- default provider is currently Gemini

Groq support still exists as an optional provider path.

## Current Grounded Flow

1. The app sends an ayah explanation request to `POST /api/quran/ai-explain`.
2. The app forwards that request to the Worker using `HIFZER_AI_GATEWAY_URL`.
3. The Worker fetches grounded Qur'an context from Quran MCP.
4. The Worker asks the configured model provider to produce a structured, ayah-specific explanation.
5. The app displays:
   - explanation insights
   - tafsir insights
   - word notes

## Worker Env

Required for the current default deployment:

- `AI_GATEWAY_SHARED_SECRET`
- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY`

Recommended:

- `GEMINI_MODEL=gemini-2.5-flash`
- `QURAN_MCP_URL=https://mcp.quran.ai`

Optional Groq configuration:

- `GROQ_API_KEY`
- `GROQ_MODEL=openai/gpt-oss-20b`
- `GROQ_FORMAT_MODEL=openai/gpt-oss-20b`

## Hifzer App Env

Set these in the Next.js app:

- `HIFZER_AI_GATEWAY_URL`
- `HIFZER_AI_GATEWAY_TOKEN`
- `HIFZER_AI_GATEWAY_TIMEOUT_MS` optional

`HIFZER_AI_GATEWAY_TOKEN` should match `AI_GATEWAY_SHARED_SECRET` in the Worker.

## Local Dev

```bash
cp workers/ai-gateway/.dev.vars.example workers/ai-gateway/.dev.vars
pnpm ai:worker:dev
```

Suggested `.dev.vars` for the current default setup:

```env
AI_GATEWAY_SHARED_SECRET=...
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
QURAN_MCP_URL=https://mcp.quran.ai
```

Optional Groq values can also be added when needed.

## Deploy

```bash
pnpm ai:worker:login
pnpm ai:worker:whoami
printf '%s' 'YOUR_GEMINI_API_KEY' | pnpm exec wrangler secret put GEMINI_API_KEY --config workers/ai-gateway/wrangler.jsonc
printf '%s' 'YOUR_SHARED_SECRET' | pnpm exec wrangler secret put AI_GATEWAY_SHARED_SECRET --config workers/ai-gateway/wrangler.jsonc
pnpm ai:worker:deploy:dry
pnpm ai:worker:deploy
```

Optional Groq secret:

```bash
printf '%s' 'YOUR_GROQ_API_KEY' | pnpm exec wrangler secret put GROQ_API_KEY --config workers/ai-gateway/wrangler.jsonc
```

Then point the app at the deployed Worker:

```env
HIFZER_AI_GATEWAY_URL=https://your-worker.your-subdomain.workers.dev
HIFZER_AI_GATEWAY_TOKEN=the-same-shared-secret
```

## Verify

Worker health:

```bash
curl https://your-worker.your-subdomain.workers.dev/health \
  -H "authorization: Bearer YOUR_SHARED_SECRET"
```

App-level smoke test:

```bash
curl -X POST https://your-app-domain.com/api/quran/ai-explain \
  -H 'content-type: application/json' \
  --data '{"ayahId":1}'
```

## Operational Notes

- `/health` is protected and requires the shared bearer token.
- The Worker should remain the only layer that knows about model-provider specifics.
- Keep API keys and the shared secret server-side only.

## Related Docs

- `../../docs/ai-gateway-cloudflare-setup.md`
- `../../docs/operational-troubleshooting.md`
