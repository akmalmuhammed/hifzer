import { expect, test, type Page } from "@playwright/test";
import { capturePageErrors } from "./helpers/page-errors";

test.describe.configure({ mode: "serial" });

const BROWSER_PUBLIC_ROUTES = ["/", "/quran-preview"] as const;
const SIGN_IN_CTA_ROUTES = BROWSER_PUBLIC_ROUTES;
const PRIMARY_CTA_ROUTES = [
  { route: "/", label: /^start free$/i, expected: /\/signup(?:\?|$)/ },
  { route: "/quran-preview", label: /sign in for full qur'?an view/i, expected: /\/login(?:\?|$)/ },
] as const;

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/dua",
  "/hifz",
  "/session",
  "/quran",
  "/history",
  "/settings",
  "/onboarding",
  "/practice",
  "/notifications",
  "/milestones",
  "/fluency",
  "/billing",
] as const;

async function clickSignInCta(route: string, page: Page) {
  await page.goto(route, { waitUntil: "domcontentloaded" });

  const link = page.getByRole("link", { name: /^sign in$/i }).first();
  if (await link.isVisible()) {
    await link.click();
    return;
  }

  const button = page.getByRole("button", { name: /^sign in$/i }).first();
  await button.click();
}

async function clickRouteCta(route: string, label: RegExp, page: Page) {
  await page.goto(route, { waitUntil: "domcontentloaded" });

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

  throw new Error(`Could not find a CTA matching ${label} on ${route}.`);
}

test("signed-out Sign in CTA routes to /login from public pages", async ({ page }) => {
  for (const route of SIGN_IN_CTA_ROUTES) {
    await clickSignInCta(route, page);
    await page.waitForURL(/\/login(?:\?|$)/, { timeout: 10_000 });
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

test("signed-out GET /dua redirects to /login or Clerk sign-in flow", async ({ request }) => {
  const response = await request.get("/dua", { maxRedirects: 0 });
  const status = response.status();
  expect([301, 302, 303, 307, 308]).toContain(status);

  const location = response.headers()["location"] ?? "";
  expect(
    /\/login(?:\?|$)|\/sign-in(?:\?|$)|\/sso-callback(?:\?|$)/i.test(location),
    `Expected redirect location to auth flow, got: ${location}`,
  ).toBe(true);
});

test("primary public CTAs navigate to live destinations", async ({ page }) => {
  for (const item of PRIMARY_CTA_ROUTES) {
    await clickRouteCta(item.route, item.label, page);
    await page.waitForURL(item.expected, { timeout: 10_000 });
    await expect(page, `Expected CTA from ${item.route} to land on ${item.expected}`).toHaveURL(item.expected);
  }
});

test("signed-out public pages avoid protected-route links", async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? "http://localhost:3002").origin;

  for (const route of BROWSER_PUBLIC_ROUTES) {
    await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
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
  for (const route of BROWSER_PUBLIC_ROUTES) {
    const capture = capturePageErrors(page);
    await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(300);
    capture.detach();

    const corsErrors = capture.consoleErrors.filter((entry) => /cors/i.test(entry));
    expect(corsErrors, `Unexpected CORS console errors on ${route}`).toEqual([]);
  }
});

test("canonical on /compare is self (not root)", async ({ request }) => {
  const response = await request.get("/compare");
  expect(response.status()).toBe(200);
  const html = await response.text();
  const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
  expect(canonicalMatch?.[1], "Missing canonical link on /compare").toBeTruthy();
  expect(canonicalMatch?.[1]).toMatch(/\/compare\/?$/);
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

  const gatedPrefixes = ["/quran/", "/dashboard", "/dua", "/hifz", "/session", "/settings", "/history", "/billing"];
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
