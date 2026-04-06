# Hifzer AI Gateway

Cloudflare Worker gateway for grounded AI features in Hifzer.

Current launch shape:

- Provider abstraction is built in the Worker.
- Gemini is the first live provider.
- Quran MCP powers grounded Qur'an retrieval for `Explain this ayah`.
- Hifzer calls the Worker server-to-server through `HIFZER_AI_GATEWAY_URL`.

## Worker env

Required for the first launch:

- `GEMINI_API_KEY`

Recommended:

- `AI_GATEWAY_SHARED_SECRET`
- `AI_PROVIDER=gemini`
- `GEMINI_MODEL=gemini-2.5-flash`
- `QURAN_MCP_URL=https://mcp.quran.ai`

## Hifzer app env

Set these in the Next.js app deployment:

- `HIFZER_AI_GATEWAY_URL`
- `HIFZER_AI_GATEWAY_TOKEN`

`HIFZER_AI_GATEWAY_TOKEN` should match `AI_GATEWAY_SHARED_SECRET` in the Worker.

## Local dev

```bash
cp workers/ai-gateway/.dev.vars.example workers/ai-gateway/.dev.vars
pnpm ai:worker:dev
```

Add local secrets in `workers/ai-gateway/.dev.vars`:

```env
GEMINI_API_KEY=...
AI_GATEWAY_SHARED_SECRET=...
AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
QURAN_MCP_URL=https://mcp.quran.ai
```

## Deploy

```bash
pnpm ai:worker:login
pnpm ai:worker:whoami
printf '%s' 'YOUR_GEMINI_API_KEY' | pnpm exec wrangler secret put GEMINI_API_KEY --config workers/ai-gateway/wrangler.jsonc
printf '%s' 'YOUR_SHARED_SECRET' | pnpm exec wrangler secret put AI_GATEWAY_SHARED_SECRET --config workers/ai-gateway/wrangler.jsonc
pnpm ai:worker:deploy:dry
pnpm ai:worker:deploy
```

After deploy, point the app at the Worker:

```env
HIFZER_AI_GATEWAY_URL=https://your-worker.your-subdomain.workers.dev
HIFZER_AI_GATEWAY_TOKEN=the-same-shared-secret
```

Full Cloudflare setup:

- [`docs/ai-gateway-cloudflare-setup.md`](/workspaces/hifzer/docs/ai-gateway-cloudflare-setup.md)
