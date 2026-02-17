import { expect, test, type Page } from "@playwright/test";
import { capturePageErrors } from "./helpers/page-errors";

const PUBLIC_ROUTES = [
  "/",
  "/welcome",
  "/pricing",
  "/legal",
  "/legal/terms",
  "/legal/privacy",
  "/legal/refund-policy",
  "/legal/sources",
  "/changelog",
] as const;

const CTA_ROUTES = ["/", "/welcome", "/pricing"] as const;

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

test("signed-out Sign in CTA routes to /login from public pages", async ({ page }) => {
  for (const route of CTA_ROUTES) {
    await clickSignInCta(route, page);
    await expect(page, `Expected Sign in from ${route} to land on /login`).toHaveURL(/\/login(?:\?|$)/);
  }
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
  for (const route of PUBLIC_ROUTES) {
    const capture = capturePageErrors(page);
    await page.goto(route);
    await page.waitForTimeout(300);
    capture.detach();

    const corsErrors = capture.consoleErrors.filter((entry) => /cors/i.test(entry));
    expect(corsErrors, `Unexpected CORS console errors on ${route}`).toEqual([]);
  }
});
