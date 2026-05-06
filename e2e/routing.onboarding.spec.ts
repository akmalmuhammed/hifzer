import { expect, test } from "@playwright/test";
import { hasClerkAuthE2EConfig, signInAsClerkTestUser } from "./helpers/clerk-auth";
import { capturePageErrors } from "./helpers/page-errors";

test.describe("onboarding routing", () => {
  test.skip(!hasClerkAuthE2EConfig(), "Requires Clerk auth E2E env vars");

  test.beforeEach(async ({ page }) => {
    await signInAsClerkTestUser(page, { markOnboardingComplete: false });
  });

  test("assessment page has no runtime/hydration errors", async ({ page }) => {
    const capture = capturePageErrors(page);
    await page.goto("/onboarding/assessment");
    await expect(page).toHaveURL(/\/onboarding\/assessment(?:\?|$)/);
    await expect(page.getByText(/step 1 of 3/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /back/i })).toBeVisible();
    await page.waitForTimeout(300);
    capture.detach();

    expect(capture.pageErrors).toEqual([]);
  });

  test("assessment save failure keeps the user on assessment", async ({ page }) => {
    await page.route("**/api/profile/assessment", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Forced assessment failure." }),
      });
    });

    await page.goto("/onboarding/assessment");
    await page.getByRole("button", { name: /^continue$/i }).first().click();

    await expect(page).toHaveURL(/\/onboarding\/assessment(?:\?|$)/);
    await expect(page.getByText(/could not save setup/i)).toBeVisible();
  });

  test("back navigation preserves onboarding answers in the current three-step flow", async ({ page }) => {
    await page.goto("/onboarding/assessment");
    await page.locator("#assessment-daily-minutes").fill("33");
    await page.locator("#assessment-practice-days").fill("5");
    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/start-point(?:\?|$)/);

    await page.getByRole("link", { name: /^back$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/assessment(?:\?|$)/);
    await expect(page.locator("#assessment-daily-minutes")).toHaveValue("33");
    await expect(page.locator("#assessment-practice-days")).toHaveValue("5");
  });

  test("start-point save failure keeps the user on start point", async ({ page }) => {
    await page.goto("/onboarding/assessment");
    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/start-point(?:\?|$)/);

    await page.route("**/api/profile/start-point", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Forced start-point failure." }),
      });
    });

    await page.getByRole("button", { name: /finish setup/i }).first().click();

    await expect(page).toHaveURL(/\/onboarding\/start-point(?:\?|$)/);
    await expect(page.getByText(/could not save starting point/i)).toBeVisible();
  });

  test("deep-linking to completion is gated until required inputs exist", async ({ page }) => {
    await page.goto("/onboarding/complete");
    await expect(page).toHaveURL(/\/onboarding\/assessment(?:\?|$)/);
  });

  test("onboarding flow completes and unlocks /dashboard", async ({ page }) => {
    await page.goto("/onboarding/welcome");
    await expect(page).toHaveURL(/\/onboarding\/assessment(?:\?|$)/);
    await expect(page.getByText(/step 1 of 3/i)).toBeVisible();

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/start-point(?:\?|$)/);
    await expect(page.getByText(/step 2 of 3/i)).toBeVisible();

    await page.getByRole("button", { name: /finish setup/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/complete(?:\?|$)/);
    await expect(page.getByText(/step 3 of 3/i)).toBeVisible();

    await page.getByRole("button", { name: /open dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await expect(page.getByRole("heading", { name: /^dashboard$/i })).toBeVisible();
  });
});
