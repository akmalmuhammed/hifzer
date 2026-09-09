import { expect, test } from "@playwright/test";
import { hasClerkAuthE2EConfig, seedLocalStartPoint, signInAsClerkTestUser } from "./helpers/clerk-auth";

const MOBILE_WIDTHS = [320, 390] as const;

for (const width of MOBILE_WIDTHS) {
  test(`public reading and recovery surfaces remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/quran-preview", "/login", "/legal/privacy"] as const) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${route} has horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
    await expect(page.getByText(/journal text.*excluded from product analytics/i)).toBeVisible();
  });
}

test.describe("high-impact app flow", () => {
  test("next action, compact reading, mobile navigation, and destructive reset are explicit", async ({ page }) => {
    if (hasClerkAuthE2EConfig()) {
      await signInAsClerkTestUser(page);
    } else {
      await page.goto("/dashboard");
    }
    await seedLocalStartPoint(page);
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/dashboard");
    if (hasClerkAuthE2EConfig()) {
      await expect(page.getByText("Recommended next action")).toBeVisible();
    } else {
      await expect(page.getByRole("link", { name: /sign in again/i })).toBeVisible();
    }
    await expect(page.locator('nav[aria-label="Primary navigation"]')).toBeVisible();

    await page.goto("/quran/read?view=compact");
    await expect(page.getByRole("group", { name: /text size/i })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await page.goto("/dua");
    const moduleLink = page.locator('a[href^="/dua/"]:not([href*="/deck"])').first();
    if (await moduleLink.isVisible()) await moduleLink.click();
    const reset = page.getByRole("button", { name: /reset progress/i });
    if (await reset.isVisible()) {
      await reset.click();
      await expect(page.getByRole("button", { name: /confirm reset/i })).toBeVisible();
      await expect(page.getByText(/clears every visited step and repetition count/i)).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).click();
    }
  });
});
