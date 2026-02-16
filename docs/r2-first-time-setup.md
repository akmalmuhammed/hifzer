# Cloudflare R2 First-Time Setup (Hifzer)

This guide sets up Quran audio hosting for Hifzer with the current key format:

`{reciterId}/{ayahId}.mp3`

Example: `default/1.mp3`

The app resolves audio from:

- `NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL`
- `src/hifzer/audio/config.ts`

If the env var is empty, the UI shows a safe "Audio not configured" state.

## 1. Create the R2 bucket

1. Open Cloudflare Dashboard.
2. Go to `R2` -> `Create bucket`.
3. Use a name like `hifzer-audio-prod` (or `hifzer-audio-dev` for testing).
4. Keep object versioning optional for now.

## 2. Expose a public read URL

Choose one of these approaches:

1. R2 public bucket domain (quickest).
2. Custom domain through Cloudflare (recommended for production).

After setup, you need a base URL like:

- `https://pub-xxxxxxxx.r2.dev`
- or `https://audio.hifzer.app`

## 3. Configure CORS on the bucket

Set CORS so browser audio requests succeed from your app domains.

Use this policy (adjust origins as needed):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://hifzer.app",
      "https://www.hifzer.app"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

## 4. Prepare object keys and file naming

Hifzer expects:

- `reciterId` folder (for now at least `default`)
- filename = global ayah id + `.mp3`
- total ayahs = 6,236

Required minimum set for MVP:

- `default/1.mp3` ... `default/6236.mp3`

## 5. Generate a manifest before upload

From `D:\hifzer`:

```bash
pnpm audio:manifest -- --reciters default --out tmp/audio-manifest.csv
```

Optional with a base URL preview:

```bash
pnpm audio:manifest -- --reciters default --base-path https://audio.hifzer.app --out tmp/audio-manifest.csv
```

This creates a CSV you can use to audit missing uploads.

## 6. Upload files to R2

You can upload with Cloudflare UI for small tests, but use CLI for full batches.

### Option A: Wrangler (recommended)

1. Install Wrangler: `pnpm dlx wrangler --version`
2. Login: `pnpm dlx wrangler login`
3. Upload a folder:

```bash
pnpm dlx wrangler r2 object put hifzer-audio-prod/default/1.mp3 --file .\audio\default\1.mp3
```

For bulk uploads, run a PowerShell loop over local files and map filename to key.

### Option B: S3-compatible tools

R2 supports S3-compatible API credentials. If you prefer `aws s3`/`rclone`, configure endpoint + keys from Cloudflare R2 API tokens and sync the `default/` directory.

## 7. Configure Hifzer env var

In your app env file (for example `.env.local`):

```env
NEXT_PUBLIC_HIFZER_AUDIO_BASE_URL=https://audio.hifzer.app
```

Restart dev server after updating env.

## 8. Verify in the app

1. Open `/quran/surah/1`
2. Confirm each ayah row shows playable audio
3. Open `/session` and confirm player appears in queue items

Quick direct check:

```bash
curl -I https://audio.hifzer.app/default/1.mp3
```

Expect `200 OK` and audio content type.

## 9. Common issues

1. `403` on audio URL:
   - Bucket/object not public or token policy too strict.
2. Browser playback blocked:
   - Missing/incorrect CORS allowed origin.
3. 404 for many ayahs:
   - Key naming mismatch. Ensure global ayah ids (1..6236), not `surah-ayah` filenames.
4. Wrong file extension:
   - App currently expects `.mp3`.

## 10. Reciter expansion later

When adding more reciters:

1. Upload keys under new folders (for example `husary/1.mp3`).
2. Generate manifest:

```bash
pnpm audio:manifest -- --reciters default,husary --out tmp/audio-manifest.csv
```

3. Add reciter IDs to your app settings/entitlements when ready.
