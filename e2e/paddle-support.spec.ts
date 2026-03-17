import { expect, test } from "@playwright/test";
import { hasClerkAuthE2EConfig, signInAsClerkTestUser } from "./helpers/clerk-auth";

test("support page creates a Paddle transaction and opens checkout", async ({ page }) => {
  test.skip(!hasClerkAuthE2EConfig(), "Requires Clerk auth E2E env vars");
  const consoleMessages: string[] = [];
  page.on("console", (message) => {
    consoleMessages.push(`[${message.type()}] ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    consoleMessages.push(`[pageerror] ${error.message}`);
  });

  await signInAsClerkTestUser(page);
  await page.goto("/support");

  await expect(page.getByRole("heading", { name: /Talk to the Dev/i })).toBeVisible();
  await expect(page.getByText(/Support Hifzer/i)).toBeVisible();
  await page.waitForTimeout(5000);

  const paddleState = await page.evaluate(() => {
    return {
      hasPaddle: Boolean((window as Window & { Paddle?: unknown }).Paddle),
      initialized: Boolean((window as Window & { __hifzerPaddleInitialized?: boolean }).__hifzerPaddleInitialized),
      scriptSources: Array.from(document.querySelectorAll("script[src]")).map((node) => node.getAttribute("src")),
    };
  });

  console.log("PADDLE_STATE", JSON.stringify(paddleState, null, 2));
  console.log("CONSOLE_MESSAGES", JSON.stringify(consoleMessages, null, 2));

  await page.getByRole("button", { name: /\$3/ }).click();

  const checkoutResponsePromise = page.waitForResponse((response) => {
    return response.url().includes("/api/paddle/checkout") && response.request().method() === "POST";
  });

  await page.getByRole("button", { name: /Support with \$3\.00/i }).click();

  const checkoutResponse = await checkoutResponsePromise;
  expect(checkoutResponse.ok()).toBe(true);

  const payload = (await checkoutResponse.json()) as { transactionId?: string };
  expect(payload.transactionId).toBeTruthy();

  const paddleFrame = page.locator('iframe[src*="paddle.com"], iframe[name*="paddle"]');
  await expect(paddleFrame.first()).toBeVisible({ timeout: 15000 });
});
