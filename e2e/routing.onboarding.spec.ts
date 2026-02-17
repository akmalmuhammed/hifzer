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
    await page.waitForTimeout(300);
    capture.detach();

    expect(capture.pageErrors).toEqual([]);
  });

  test("plan-preview page has no runtime/hydration errors", async ({ page }) => {
    const capture = capturePageErrors(page);
    await page.goto("/onboarding/plan-preview");
    await expect(page).toHaveURL(/\/onboarding\/plan-preview(?:\?|$)/);
    await page.waitForTimeout(300);
    capture.detach();

    expect(capture.pageErrors).toEqual([]);
  });

  test("onboarding flow completes and unlocks /today", async ({ page }) => {
    await page.goto("/onboarding/welcome");
    await expect(page).toHaveURL(/\/onboarding\/welcome(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/assessment(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/start-point(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/plan-preview(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/permissions(?:\?|$)/);

    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/complete(?:\?|$)/);

    await page.getByRole("button", { name: /go to today/i }).first().click();
    await expect(page).toHaveURL(/\/today(?:\?|$)/);
  });
});

