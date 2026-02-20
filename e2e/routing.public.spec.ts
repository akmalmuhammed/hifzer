import { expect, test, type Page } from "@playwright/test";
import { capturePageErrors } from "./helpers/page-errors";

const CTA_ROUTES = ["/", "/pricing"] as const;
const CORS_CHECK_ROUTES = ["/", "/pricing", "/quran-preview"] as const;

const PROTECTED_PREFIXES = [
  "/today",
  "/session",
  "/quran",
  "/progress",
  "/history",
  "/settings",
  "/onboarding",
  "/practice",
  "/notifications",
  "/streak",
  "/milestones",
  "/fluency",
  "/billing",
] as const;

async function clickSignInCta(route: string, page: Page) {
  await page.goto(route);

  const link = page.getByRole("link", { name: /^sign in$/i }).first();
  if (await link.isVisible()) {
    await link.click();
    return;
  }

  const button = page.getByRole("button", { name: /^sign in$/i }).first();
  await button.click();
}

async function clickPricingPrimaryCta(page: Page) {
  await page.goto("/pricing");

  const labels = [/^start free$/i, /^get started$/i, /^claim free pro access$/i];
  for (const label of labels) {
    const link = page.getByRole("link", { name: label }).first();
    if (await link.isVisible()) {
      await link.click();
      return;
    }
    const button = page.getByRole("button", { name: label }).first();
    if (await button.isVisible()) {
      await button.click();
      return;
    }
  }

  throw new Error("Could not find a primary pricing CTA.");
}

test("signed-out Sign in CTA routes to /login from public pages", async ({ page }) => {
  for (const route of CTA_ROUTES) {
    await clickSignInCta(route, page);
    await expect(page, `Expected Sign in from ${route} to land on /login`).toHaveURL(/\/login(?:\?|$)/);
  }
});

test("signed-out GET /quran-preview returns 200", async ({ request }) => {
  const response = await request.get("/quran-preview");
  expect(response.status()).toBe(200);
});

test("signed-out GET /quran redirects to /login or Clerk sign-in flow", async ({ request }) => {
  const response = await request.get("/quran", { maxRedirects: 0 });
  const status = response.status();
  expect([301, 302, 303, 307, 308]).toContain(status);

  const location = response.headers()["location"] ?? "";
  expect(
    /\/login(?:\?|$)|\/sign-in(?:\?|$)|\/sso-callback(?:\?|$)/i.test(location),
    `Expected redirect location to auth flow, got: ${location}`,
  ).toBe(true);
});

test("pricing primary CTA navigates (no dead click)", async ({ page }) => {
  await clickPricingPrimaryCta(page);
  await expect(page).toHaveURL(/\/(login|signup|today)(?:\?|$)/);
});

test("signed-out public pages avoid protected-route links", async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? "http://localhost:3002").origin;

  for (const route of CTA_ROUTES) {
    await page.goto(route);
    const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((anchor) => (anchor as HTMLAnchorElement).href),
    );

    const protectedLinks = hrefs
      .map((href) => new URL(href, origin))
      .filter((url) => url.origin === origin)
      .map((url) => `${url.pathname}${url.search}`)
      .filter((path) => PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)));

    expect(protectedLinks, `Found protected links on signed-out public route ${route}`).toEqual([]);
  }
});

test("signed-out public pages emit no CORS console errors", async ({ page }) => {
  test.setTimeout(60_000);
  for (const route of CORS_CHECK_ROUTES) {
    const capture = capturePageErrors(page);
    await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(300);
    capture.detach();

    const corsErrors = capture.consoleErrors.filter((entry) => /cors/i.test(entry));
    expect(corsErrors, `Unexpected CORS console errors on ${route}`).toEqual([]);
  }
});

test("canonical on /pricing is self (not root)", async ({ request }) => {
  const response = await request.get("/pricing");
  expect(response.status()).toBe(200);
  const html = await response.text();
  const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
  expect(canonicalMatch?.[1], "Missing canonical link on /pricing").toBeTruthy();
  expect(canonicalMatch?.[1]).toMatch(/\/pricing\/?$/);
});

test("sitemap has no double-slash URLs and no gated routes", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();

  const locs = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map((m) => m[1] ?? "");
  expect(locs.length).toBeGreaterThan(0);
  expect(
    locs.filter((loc) => /https?:\/\/[^/]+\/\//.test(loc)),
    "Sitemap contains malformed // URLs",
  ).toEqual([]);

  const gatedPrefixes = ["/quran/", "/today", "/session", "/progress", "/settings", "/history", "/billing"];
  const gatedLocs = locs.filter((loc) => {
    try {
      const path = new URL(loc).pathname;
      return gatedPrefixes.some((prefix) => path === prefix || path.startsWith(prefix));
    } catch {
      return false;
    }
  });
  expect(gatedLocs, `Sitemap contains gated routes: ${gatedLocs.join(", ")}`).toEqual([]);
});
