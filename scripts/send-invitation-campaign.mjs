import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const CAMPAIGN_ID = "latest-product-update-2026-07";
const args = process.argv.slice(2);
const shouldSend = args.includes("--send");
const confirmation = args.find((arg) => arg.startsWith("--confirm="))?.split("=", 2)[1];
const limitRaw = args.find((arg) => arg.startsWith("--limit="))?.split("=", 2)[1];
const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 75;
const baseUrl = (process.env.CAMPAIGN_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const cronSecret = process.env.CRON_SECRET?.trim();

if (!baseUrl) {
  throw new Error("Set NEXT_PUBLIC_APP_URL or CAMPAIGN_APP_URL before running the campaign command.");
}
if (!cronSecret) {
  throw new Error("CRON_SECRET is required to call the protected campaign route.");
}
if (!Number.isFinite(limit) || limit < 1 || limit > 75) {
  throw new Error("--limit must be between 1 and 75.");
}
if (shouldSend && confirmation !== CAMPAIGN_ID) {
  throw new Error(`Sending requires --confirm=${CAMPAIGN_ID}`);
}

const action = shouldSend ? "send" : "preview";
const response = await fetch(`${baseUrl}/api/admin/send-invitation`, {
  method: "POST",
  headers: {
    authorization: `Bearer ${cronSecret}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    action,
    audience: "all-users",
    limit,
  }),
});
const payload = await response.json();

if (!response.ok) {
  console.error(JSON.stringify(payload, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(payload, null, 2));
}
