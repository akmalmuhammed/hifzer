# AI Gateway Cloudflare Setup

This runbook deploys the Hifzer AI gateway Worker with the current default setup:

- provider: Groq
- grounding: Quran MCP
- app integration: `POST /api/quran/ai-explain`

## 1. Install Dependencies

```bash
pnpm install
```

Wrangler is already included in the repo as a dev dependency.

## 2. Authenticate Wrangler

```bash
pnpm exec wrangler login
pnpm exec wrangler whoami --json
```

If `whoami` fails, login is not complete.

## 3. Prepare Local Worker Vars

```bash
cp workers/ai-gateway/.dev.vars.example workers/ai-gateway/.dev.vars
```

Fill in at minimum:

- `AI_GATEWAY_SHARED_SECRET`
- `AI_PROVIDER=groq`
- `GROQ_API_KEY`

Recommended current values:

- `GROQ_MODEL=openai/gpt-oss-20b`
- `GROQ_FORMAT_MODEL=openai/gpt-oss-20b`
- `QURAN_MCP_URL=https://mcp.quran.ai`

Optional Gemini fallback values:

- `GEMINI_API_KEY`
- `GEMINI_MODEL=gemini-2.5-flash`

Generate a shared secret if needed:

```bash
openssl rand -base64 32 | tr -d '\n'
```

## 4. Run The Worker Locally

```bash
pnpm ai:worker:dev
```

Health check:

```bash
curl http://127.0.0.1:8787/health
```

## 5. Upload Production Secrets

Current default secrets:

```bash
printf '%s' 'YOUR_GROQ_API_KEY' | pnpm exec wrangler secret put GROQ_API_KEY --config workers/ai-gateway/wrangler.jsonc
printf '%s' 'YOUR_SHARED_SECRET' | pnpm exec wrangler secret put AI_GATEWAY_SHARED_SECRET --config workers/ai-gateway/wrangler.jsonc
```

Optional Gemini fallback secret:

```bash
printf '%s' 'YOUR_GEMINI_API_KEY' | pnpm exec wrangler secret put GEMINI_API_KEY --config workers/ai-gateway/wrangler.jsonc
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
curl https://your-worker.your-subdomain.workers.dev/health
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

## Notes

- The Worker is provider-aware, but Groq is the current default deployment path.
- The Worker should remain the only layer that knows about model-provider specifics.
- Keep API keys and the shared secret server-side only.
