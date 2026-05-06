import { chromium } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const envFiles = [".env", ".env.local", ".env.vercel.production"].filter((file) =>
  fs.existsSync(path.join(process.cwd(), file)),
);
dotenv.config({ path: envFiles, override: true });

const baseUrl = (process.env.HIFZER_LIVE_SMOKE_BASE_URL ?? "https://www.hifzer.com").replace(/\/$/, "");
const emailAddress = process.env.HIFZER_LIVE_SMOKE_EMAIL ?? process.env.E2E_CLERK_TEST_EMAIL;
const routeList = (
  process.env.HIFZER_LIVE_SMOKE_ROUTES ??
  "/dashboard,/quran/read?view=compact,/quran/bookmarks,/assistant,/settings/quran-foundation"
)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const screenshotEnabled = process.env.HIFZER_LIVE_SMOKE_SCREENSHOTS !== "0";
const outputDir = path.join(process.cwd(), "output", "live-auth-smoke");

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function safeFileName(route) {
  return route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "root";
}

requiredEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
requiredEnv("CLERK_SECRET_KEY");
if (!emailAddress) {
  throw new Error("Missing HIFZER_LIVE_SMOKE_EMAIL or E2E_CLERK_TEST_EMAIL.");
}

// Always create a fresh testing token from the Clerk secret. Stale local tokens
// commonly fail against production with "ticket is invalid".
delete process.env.CLERK_TESTING_TOKEN;
await clerkSetup({ dotenv: false });

fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  emailAddress,
  routes: [],
};

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await clerk.signIn({ page, emailAddress });

  for (const route of routeList) {
    const pageErrors = [];
    const consoleErrors = [];
    const onPageError = (error) => pageErrors.push(error.message);
    const onConsole = (message) => {
      if (message.type() === "error") {
        const text = message.text();
        if (!/analytics|googletagmanager|sentry|Failed to load resource: the server responded with a status of 400/i.test(text)) {
          consoleErrors.push(text);
        }
      }
    };

    page.on("pageerror", onPageError);
    page.on("console", onConsole);
    const response = await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => null);
    page.off("pageerror", onPageError);
    page.off("console", onConsole);

    const result = {
      route,
      status: response?.status() ?? null,
      finalUrl: page.url(),
      h1: await page.locator("h1").first().textContent({ timeout: 5_000 }).catch(() => null),
      pageErrors,
      consoleErrors,
    };
    report.routes.push(result);

    if (screenshotEnabled) {
      await page.screenshot({
        path: path.join(outputDir, `${safeFileName(route)}.png`),
        fullPage: false,
      });
    }
  }
} finally {
  await browser.close();
}

const failures = report.routes.filter((route) => {
  const badStatus = !route.status || route.status >= 400;
  const redirectedToAuth = /\/login|\/onboarding/.test(route.finalUrl);
  return badStatus || redirectedToAuth || route.pageErrors.length > 0 || route.consoleErrors.length > 0;
});

const reportPath = path.join(outputDir, "report.json");
fs.writeFileSync(reportPath, JSON.stringify({ ...report, ok: failures.length === 0 }, null, 2));

console.log(JSON.stringify({
  ok: failures.length === 0,
  reportPath,
  routes: report.routes.map((route) => ({
    route: route.route,
    status: route.status,
    finalUrl: route.finalUrl,
    h1: route.h1,
    pageErrors: route.pageErrors.length,
    consoleErrors: route.consoleErrors.length,
  })),
}, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
