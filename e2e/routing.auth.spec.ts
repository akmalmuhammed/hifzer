import { expect, test } from "@playwright/test";
import { hasClerkAuthE2EConfig, seedLocalStartPoint, signInAsClerkTestUser } from "./helpers/clerk-auth";

test.describe.configure({ mode: "serial" });

test.describe("authenticated routing", () => {
  test.skip(!hasClerkAuthE2EConfig(), "Requires Clerk auth E2E env vars");

  test("signed-in users hitting /login or /signup land on /dashboard", async ({ page }) => {
    await signInAsClerkTestUser(page);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);

    await page.goto("/signup");
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
  });

  test("signed-in auth pages honor safe redirect_url destinations", async ({ page }) => {
    await signInAsClerkTestUser(page);

    await page.goto("/login?redirect_url=%2Fsupport");
    await expect(page).toHaveURL(/\/support(?:\?|$)/);

    await page.goto("/signup?redirect_url=%2Fsettings%2Faccount");
    await expect(page).toHaveURL(/\/settings\/account(?:\?|$)/);
  });

  test("public auth CTAs route signed-in users to /dashboard", async ({ page }) => {
    await signInAsClerkTestUser(page);

    for (const route of ["/", "/compare", "/quran-preview"] as const) {
      await page.goto(route);
      await page.locator('a[href="/dashboard"]').first().click();

      await expect(page, `Expected signed-in CTA from ${route} to land on /dashboard`).toHaveURL(
        /\/dashboard(?:\?|$)/,
      );
    }
  });

  test("dashboard side-nav and in-page CTAs route correctly", async ({ page }) => {
    await signInAsClerkTestUser(page);
    await seedLocalStartPoint(page);

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /^dashboard$/i })).toBeVisible();

    const sideNavMatrix = [
      { href: "/dashboard", expected: /\/dashboard(?:\?|$)/ },
      { href: "/hifz", expected: /\/hifz(?:\?|$)/ },
      { href: "/quran", expected: /\/quran(?:\?|$)/ },
      { href: "/dua", expected: /\/dua(?:\?|$)/ },
      { href: "/journal", expected: /\/journal(?:\?|$)/ },
      { href: "/roadmap", expected: /\/roadmap(?:\?|$)/ },
    ] as const;

    for (const item of sideNavMatrix) {
      await page.goto("/dashboard");
      await page.locator(`aside a[href="${item.href}"]`).first().click();
      await expect(page, `Side-nav click failed for ${item.href}`).toHaveURL(item.expected);
    }

    const inPageCtaMatrix = [
      { href: "/hifz", expected: /\/hifz(?:\?|$)/ },
      { href: "/quran/read?view=compact", expected: /\/quran\/read\?view=compact(?:&|$)/ },
      { href: "/dua", expected: /\/dua(?:\?|$)/ },
      { href: "/journal", expected: /\/journal(?:\?|$)/ },
    ] as const;

    for (const item of inPageCtaMatrix) {
      await page.goto("/dashboard");
      await page.locator(`a[href="${item.href}"]`).first().click();
      await expect(page, `Dashboard CTA failed for ${item.href}`).toHaveURL(item.expected);
    }
  });
});
