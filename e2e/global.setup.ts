import { clerkSetup } from "@clerk/testing/playwright";
import dotenv from "dotenv";

export default async function globalSetup() {
  dotenv.config({ path: [".env.local", ".env"] });

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

  // Prefer a fresh testing token whenever a Clerk secret is available.
  // A checked-in/local CLERK_TESTING_TOKEN can expire or belong to another Clerk instance,
  // which makes authenticated smoke tests fail with "ticket is invalid".
  if (process.env.CLERK_SECRET_KEY) {
    delete process.env.CLERK_TESTING_TOKEN;
  }

  await clerkSetup({ dotenv: false });
}
