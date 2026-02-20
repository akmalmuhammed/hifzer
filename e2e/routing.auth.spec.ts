import { expect, test } from "@playwright/test";
import { hasClerkAuthE2EConfig, seedLocalStartPoint, signInAsClerkTestUser } from "./helpers/clerk-auth";

test.describe("authenticated routing", () => {
  test.skip(!hasClerkAuthE2EConfig(), "Requires Clerk auth E2E env vars");

  test("signed-in users hitting /login or /signup land on /today", async ({ page }) => {
    await signInAsClerkTestUser(page);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/today(?:\?|$)/);

    await page.goto("/signup");
    await expect(page).toHaveURL(/\/today(?:\?|$)/);
  });

  test("public auth CTAs route signed-in users to /today", async ({ page }) => {
    await signInAsClerkTestUser(page);

    for (const route of ["/", "/pricing"] as const) {
      await page.goto(route);
      await page.locator('a[href="/today"]').first().click();

      await expect(page, `Expected signed-in CTA from ${route} to land on /today`).toHaveURL(
        /\/today(?:\?|$)/,
      );
    }
  });

  test("today side-nav and in-page CTAs route correctly", async ({ page }) => {
    await signInAsClerkTestUser(page);
    await seedLocalStartPoint(page);

    await page.goto("/today");
    await expect(page.getByRole("heading", { name: /^today$/i })).toBeVisible();

    const sideNavMatrix = [
      { href: "/today", expected: /\/today(?:\?|$)/ },
      { href: "/hifz", expected: /\/hifz(?:\?|$)/ },
      { href: "/quran", expected: /\/quran(?:\?|$)/ },
      { href: "/progress", expected: /\/progress(?:\/|$|\?)/ },
      { href: "/history/sessions", expected: /\/history(?:\/|$|\?)/ },
      { href: "/settings", expected: /\/settings(?:\/|$|\?)/ },
    ] as const;

    for (const item of sideNavMatrix) {
      await page.goto("/today");
      await page.locator(`aside a[href="${item.href}"]`).first().click();
      await expect(page, `Side-nav click failed for ${item.href}`).toHaveURL(item.expected);
    }

    const inPageCtaMatrix = [
      { href: "/hifz", expected: /\/hifz(?:\?|$)/ },
      { href: "/quran", expected: /\/quran(?:\?|$)/ },
      { href: "/settings/display", expected: /\/settings\/display(?:\?|$)/ },
      { href: "/onboarding/start-point", expected: /\/onboarding\/start-point(?:\?|$)/ },
    ] as const;

    for (const item of inPageCtaMatrix) {
      await page.goto("/today");
      await page.locator(`a[href="${item.href}"]`).first().click();
      await expect(page, `Today CTA failed for ${item.href}`).toHaveURL(item.expected);
    }
  });
});
