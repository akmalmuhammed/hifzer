import { clerk } from "@clerk/testing/playwright";
import { expect, Page } from "@playwright/test";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function hasClerkAuthE2EConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY &&
      process.env.E2E_CLERK_TEST_EMAIL,
  );
}

export async function signInAsClerkTestUser(
  page: Page,
  options: { markOnboardingComplete?: boolean } = {},
) {
  const emailAddress = requireEnv("E2E_CLERK_TEST_EMAIL");
  const markOnboardingComplete = options.markOnboardingComplete ?? true;

  await page.goto("/");
  await clerk.signIn({ page, emailAddress });

  if (markOnboardingComplete) {
    await page.evaluate(async () => {
      await fetch("/api/profile/onboarding-quick-start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ onboardingStartLane: "hifz" }),
      }).catch(() => null);
    });
  }

  await page.goto("/dashboard");
  if (markOnboardingComplete) {
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
  }
}

export async function seedLocalStartPoint(page: Page) {
  await page.evaluate(() => {
    window.localStorage.setItem("hifzer_onboarding_completed_v1", "1");
    window.localStorage.setItem("hifzer_active_surah_number_v1", "1");
    window.localStorage.setItem("hifzer_cursor_ayah_id_v1", "1");
  });
  await page.reload();
}
