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
    await expect(page.getByText(/step 2 of 7/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
    await page.waitForTimeout(300);
    capture.detach();

    expect(capture.pageErrors).toEqual([]);
  });

  test("back navigation preserves onboarding answers", async ({ page }) => {
    await page.goto("/onboarding/assessment");
    await page.locator("#assessment-daily-minutes").fill("33");
    await page.locator("#assessment-practice-days").fill("5");
    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/start-point(?:\?|$)/);

    await page.getByRole("link", { name: /^back$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/assessment(?:\?|$)/);
    await expect(page.locator("#assessment-daily-minutes")).toHaveValue("33");
    await expect(page.locator("#assessment-practice-days")).toHaveValue("5");

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/start-point(?:\?|$)/);
    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/plan-preview(?:\?|$)/);
    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/fluency-check(?:\?|$)/);

    const fluencyOption = page.getByRole("button", { name: /i need guided fluency work/i });
    await fluencyOption.click();
    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/permissions(?:\?|$)/);

    await page.getByRole("link", { name: /^back$/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/fluency-check(?:\?|$)/);
    await expect(
      page.getByRole("button", { name: /i need guided fluency work/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("plan-preview page has no runtime/hydration errors", async ({ page }) => {
    const capture = capturePageErrors(page);
    await page.goto("/onboarding/plan-preview");
    await expect(page).toHaveURL(/\/onboarding\/plan-preview(?:\?|$)/);
    await page.waitForTimeout(300);
    capture.detach();

    expect(capture.pageErrors).toEqual([]);
  });

  test("onboarding flow completes and unlocks /dashboard", async ({ page }) => {
    await page.goto("/onboarding/welcome");
    await expect(page).toHaveURL(/\/onboarding\/welcome(?:\?|$)/);
    await expect(page.getByText(/step 1 of 7/i)).toBeVisible();

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/assessment(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/start-point(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/plan-preview(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/fluency-check(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/permissions(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/complete(?:\?|$)/);

    await page.getByRole("button", { name: /go to dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await expect(page.getByText(/start from the dashboard without guessing/i)).toBeVisible();
  });
});
