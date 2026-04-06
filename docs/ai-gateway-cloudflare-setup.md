# AI Gateway Cloudflare Setup

This runbook deploys the Hifzer AI gateway Worker with Gemini as the first provider.

## 1. Install dependencies

```bash
pnpm install
```

Wrangler is now included in this repo as a dev dependency.

## 2. Authenticate Wrangler with your Cloudflare account

```bash
pnpm exec wrangler login
pnpm exec wrangler whoami --json
```

If `whoami` returns a non-zero status, your login is not complete yet.

## 3. Prepare local Worker vars for development

```bash
cp workers/ai-gateway/.dev.vars.example workers/ai-gateway/.dev.vars
```

Fill in:

- `GEMINI_API_KEY`
- `AI_GATEWAY_SHARED_SECRET`

You can generate a strong shared secret with:

```bash
openssl rand -base64 32 | tr -d '\n'
```

## 4. Run the Worker locally

```bash
pnpm ai:worker:dev
```

Health check:

```bash
curl http://127.0.0.1:8787/health
```

## 5. Upload production secrets to Cloudflare

```bash
printf '%s' 'YOUR_GEMINI_API_KEY' | pnpm exec wrangler secret put GEMINI_API_KEY --config workers/ai-gateway/wrangler.jsonc
printf '%s' 'YOUR_SHARED_SECRET' | pnpm exec wrangler secret put AI_GATEWAY_SHARED_SECRET --config workers/ai-gateway/wrangler.jsonc
```

Optional secret rotation later uses the same commands.

## 6. Deploy the Worker

Dry run first:

```bash
pnpm ai:worker:deploy:dry
```

Real deploy:

```bash
pnpm ai:worker:deploy
```

Wrangler will print the deployed `workers.dev` URL. Use that exact URL for the app.

## 7. Set the app env vars

In Vercel for the main Hifzer app, set:

```env
HIFZER_AI_GATEWAY_URL=https://your-worker.your-subdomain.workers.dev
HIFZER_AI_GATEWAY_TOKEN=YOUR_SHARED_SECRET
```

`HIFZER_AI_GATEWAY_TOKEN` must exactly match the Worker secret `AI_GATEWAY_SHARED_SECRET`.

## 8. Verify the live Worker

Health check:

```bash
curl https://your-worker.your-subdomain.workers.dev/health
```

App route smoke test after redeploying the app:

```bash
curl -X POST https://your-app-domain.com/api/quran/ai-explain \
  -H 'content-type: application/json' \
  --data '{"ayahId":1}'
```

## 9. Tail logs if needed

```bash
pnpm ai:worker:tail
```

## Notes

- The app is provider-agnostic at the boundary, but only `gemini` is implemented today.
- The Worker uses Quran MCP for grounding and should stay the only place that knows about the model provider.
- Keep all provider keys and shared secrets server-side only.
