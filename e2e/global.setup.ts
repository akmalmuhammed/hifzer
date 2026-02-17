import { clerkSetup } from "@clerk/testing/playwright";

export default async function globalSetup() {
  const hasPublishableKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const hasSecretOrTestingToken = Boolean(process.env.CLERK_SECRET_KEY || process.env.CLERK_TESTING_TOKEN);

  if (process.env.CI && (!hasPublishableKey || !hasSecretOrTestingToken)) {
    throw new Error(
      "CI requires Clerk testing auth env vars. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and either CLERK_SECRET_KEY or CLERK_TESTING_TOKEN.",
    );
  }

  if (process.env.CI && !process.env.E2E_CLERK_TEST_EMAIL) {
    throw new Error("CI requires E2E_CLERK_TEST_EMAIL for deterministic Clerk auth routing tests.");
  }

  if (!hasPublishableKey || !hasSecretOrTestingToken) {
    return;
  }

  await clerkSetup({ dotenv: true });
}
