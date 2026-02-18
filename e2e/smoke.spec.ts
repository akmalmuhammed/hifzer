import { expect, test } from "@playwright/test";
import { hasClerkAuthE2EConfig, seedLocalStartPoint, signInAsClerkTestUser } from "./helpers/clerk-auth";

test("landing renders and links to pricing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Keep what you memorize/i })).toBeVisible();

  await page.getByRole("link", { name: /Pricing/i }).first().click();
  await page.waitForURL("**/pricing");
  await expect(page.getByRole("heading", { name: /Two tiers/i })).toBeVisible();
});

test("legal hub and policy pages render", async ({ page }) => {
  await page.goto("/legal");
  await expect(page.getByRole("heading", { name: /Policies and sources/i })).toBeVisible();

  await page.goto("/legal/terms");
  await expect(page.getByRole("heading", { name: /Terms of service/i })).toBeVisible();

  await page.goto("/legal/privacy");
  await expect(page.getByRole("heading", { name: /Privacy policy/i })).toBeVisible();

  await page.goto("/legal/refund-policy");
  await expect(page.getByRole("heading", { name: /Refund policy/i })).toBeVisible();
});

test("legal sources renders attribution blocks", async ({ page }) => {
  await page.goto("/legal/sources");
  await expect(page.getByRole("heading", { name: /Sources/i })).toBeVisible();
  await expect(page.getByText(/Tanzil metadata header/i)).toBeVisible();
  await expect(page.getByText(/Creative Commons Attribution 3.0/i)).toBeVisible();
});

test("pricing includes required policy links", async ({ page }) => {
  await page.goto("/pricing");
  const main = page.locator("#main-content");
  await expect(page.getByRole("heading", { name: /Two tiers/i })).toBeVisible();
  await expect(main.getByRole("link", { name: /Terms of service/i })).toBeVisible();
  await expect(main.getByRole("link", { name: /Privacy policy/i })).toBeVisible();
  await expect(main.getByRole("link", { name: /Refund policy/i })).toBeVisible();
});

test("quran browser renders surah index and surah 1", async ({ page }) => {
  test.skip(!hasClerkAuthE2EConfig(), "Requires Clerk auth E2E env vars");
  await signInAsClerkTestUser(page);

  await page.goto("/quran");
  await expect(page.getByRole("heading", { name: /Browse the Qur'an/i })).toBeVisible();

  await page.getByRole("link", { name: /Surah 1/i }).first().click();
  await page.waitForURL("**/quran/surah/1");
  await expect(page.getByText(/Al-Faatiha/i)).toBeVisible();

  // Audio player shell should be present (configured or not).
  await expect(
    page.getByRole("button", { name: /Play|Audio not configured/i }).first(),
  ).toBeVisible();
});

test("quran browser renders juz detail", async ({ page }) => {
  test.skip(!hasClerkAuthE2EConfig(), "Requires Clerk auth E2E env vars");
  await signInAsClerkTestUser(page);

  await page.goto("/quran");
  await page.getByRole("link", { name: /Juz 1/i }).first().click();
  await page.waitForURL("**/quran/juz/1");

  await expect(page.getByRole("heading", { name: /Juz 1/i })).toBeVisible();
  await expect(page.getByText(/Global IDs/i)).toBeVisible();
});

test("quran reader supports view toggle, filters, and compact navigation", async ({ page }) => {
  test.skip(!hasClerkAuthE2EConfig(), "Requires Clerk auth E2E env vars");
  await signInAsClerkTestUser(page);

  await page.goto("/quran/read");
  await expect(page.getByRole("heading", { name: /Read with filters \+ view modes/i })).toBeVisible();
  await expect(page.getByText(/Filter by surah, juz, and global ayah id/i)).toBeVisible();

  await page.getByRole("link", { name: /Compact view/i }).click();
  await page.waitForURL("**/quran/read?view=compact");
  await expect(page.getByText(/1 \/ 6236/i)).toBeVisible();

  await page.getByRole("link", { name: "Next" }).click();
  await expect(page.getByText(/2 \/ 6236/i)).toBeVisible();

  await page.getByLabel("Surah").selectOption("1");
  await page.getByLabel("Juz").selectOption("1");
  await page.getByLabel("Ayah (global id)").fill("");
  await page.getByRole("button", { name: /Apply filters/i }).click();

  await expect(page.getByText(/7 ayahs matched/i)).toBeVisible();
  await expect(page.getByText(/Surah 1/)).toBeVisible();
  await expect(page.getByText(/Juz 1/)).toBeVisible();

  await page.getByRole("link", { name: /List view/i }).click();
  await expect(page.getByText(/1:1/).first()).toBeVisible();
  await expect(page.getByText(/1:7/).first()).toBeVisible();

  await page.getByLabel("Surah").selectOption("114");
  await page.getByLabel("Juz").selectOption("1");
  await page.getByRole("button", { name: /Apply filters/i }).click();

  await expect(page.getByText(/No ayahs matched this filter combination/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Clear all filters/i })).toBeVisible();
});

test("session advances and updates local cursor", async ({ page }) => {
  test.skip(!hasClerkAuthE2EConfig(), "Requires Clerk auth E2E env vars");
  await signInAsClerkTestUser(page);
  await seedLocalStartPoint(page);

  await page.evaluate(() => {
    window.localStorage.removeItem("hifzer_open_session_v1");
    window.localStorage.removeItem("hifzer_attempts_v1");
    window.localStorage.removeItem("hifzer_srs_reviews_v1");
  });

  await page.goto("/session");
  await expect(page.getByRole("heading", { name: /Session/i })).toBeVisible();

  let cursor = 1;
  for (let i = 0; i < 6; i += 1) {
    const goodButton = page.getByRole("button", { name: /Good/i }).first();
    if (!(await goodButton.isVisible())) {
      break;
    }
    await goodButton.click();
    cursor = await page.evaluate(() => Number(window.localStorage.getItem("hifzer_cursor_ayah_id_v1") ?? "1"));
    if (cursor > 1) {
      break;
    }
  }

  expect(cursor).toBeGreaterThan(1);
});
