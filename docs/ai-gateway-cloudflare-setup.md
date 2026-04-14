# AI Gateway Cloudflare Setup

This runbook deploys the Hifzer AI gateway Worker with the current default setup:

- provider strategy: provider-aware
- default provider: Gemini
- optional provider: Groq
- grounding: Quran MCP
- app integration: `POST /api/quran/ai-explain`

## 1. Install Dependencies

```bash
pnpm install
```

Wrangler is already included in the repo as a dev dependency.

## 2. Authenticate Wrangler

```bash
pnpm ai:worker:login
pnpm ai:worker:whoami
```

If `whoami` fails, login is not complete.

## 3. Prepare Local Worker Vars

```bash
cp workers/ai-gateway/.dev.vars.example workers/ai-gateway/.dev.vars
```

Fill in at minimum for the default path:

- `AI_GATEWAY_SHARED_SECRET`
- `AI_PROVIDER=gemini`
- `GEMINI_API_KEY`

Recommended current values:

- `GEMINI_MODEL=gemini-2.5-flash`
- `QURAN_MCP_URL=https://mcp.quran.ai`

Optional Groq vars:

- `GROQ_API_KEY`
- `GROQ_MODEL=openai/gpt-oss-20b`
- `GROQ_FORMAT_MODEL=openai/gpt-oss-20b`

Generate a shared secret if needed:

```bash
openssl rand -base64 32 | tr -d '\n'
```

## 4. Run The Worker Locally

```bash
pnpm ai:worker:dev
```

Local health check:

```bash
curl http://127.0.0.1:8787/health \
  -H "authorization: Bearer YOUR_SHARED_SECRET"
```

Important:

- `/health` is protected by the same shared bearer token used by the app

## 5. Upload Production Secrets

Default Gemini path:

```bash
printf '%s' 'YOUR_GEMINI_API_KEY' | pnpm exec wrangler secret put GEMINI_API_KEY --config workers/ai-gateway/wrangler.jsonc
printf '%s' 'YOUR_SHARED_SECRET' | pnpm exec wrangler secret put AI_GATEWAY_SHARED_SECRET --config workers/ai-gateway/wrangler.jsonc
```

Optional Groq secret:

```bash
printf '%s' 'YOUR_GROQ_API_KEY' | pnpm exec wrangler secret put GROQ_API_KEY --config workers/ai-gateway/wrangler.jsonc
```

## 6. Deploy The Worker

Dry run:

```bash
pnpm ai:worker:deploy:dry
```

Real deploy:

```bash
pnpm ai:worker:deploy
```

Use the exact `workers.dev` URL Wrangler prints.

## 7. Configure App Env Vars

In the Next.js app deployment, set:

```env
HIFZER_AI_GATEWAY_URL=https://your-worker.your-subdomain.workers.dev
HIFZER_AI_GATEWAY_TOKEN=YOUR_SHARED_SECRET
HIFZER_AI_GATEWAY_TIMEOUT_MS=60000
```

`HIFZER_AI_GATEWAY_TOKEN` must exactly match `AI_GATEWAY_SHARED_SECRET`.

## 8. Verify Live

Worker health:

```bash
curl https://your-worker.your-subdomain.workers.dev/health \
  -H "authorization: Bearer YOUR_SHARED_SECRET"
```

App route smoke test:

```bash
curl -X POST https://your-app-domain.com/api/quran/ai-explain \
  -H 'content-type: application/json' \
  --data '{"ayahId":1}'
```

The result should be a grounded explanation payload, not a timeout or configuration error.

## 9. Tail Logs

```bash
pnpm ai:worker:tail
```

## 10. Troubleshooting

### Worker health returns `401`

- the bearer token is missing or wrong
- `/health` is intentionally protected

### App route returns `503`

- `HIFZER_AI_GATEWAY_URL` is missing
- the Worker is deployed but missing `GEMINI_API_KEY`

### App route returns `502` or `504`

- Worker is reachable but upstream model or Quran MCP failed
- use `pnpm ai:worker:tail`

### App route works locally but not in production

- the app env still points to an old Worker URL
- `HIFZER_AI_GATEWAY_TOKEN` does not match the Worker secret

## Notes

- The Worker is provider-aware, but Gemini is the current default deployment path.
- Groq remains an optional provider, not the current default.
- Keep API keys and the shared secret server-side only.
