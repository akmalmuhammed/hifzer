import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = {
  NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL,
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
};

function restoreEnv(name: keyof typeof ORIGINAL_ENV) {
  const value = ORIGINAL_ENV[name];
  if (typeof value === "string") {
    process.env[name] = value;
    return;
  }
  delete process.env[name];
}

afterEach(() => {
  restoreEnv("NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL");
  restoreEnv("NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL");
  restoreEnv("NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL");
  restoreEnv("NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL");
  vi.resetModules();
});

describe("clerkAuthRoutes", () => {
  it("normalizes legacy /today redirects back to /dashboard", async () => {
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL = "/today";
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL = "/today?from=legacy";
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL = "/today/";
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL = "/today/welcome";

    const { clerkAuthRoutes } = await import("./auth-redirects");

    expect(clerkAuthRoutes.signInForceRedirectUrl).toBe("/dashboard");
    expect(clerkAuthRoutes.signInFallbackRedirectUrl).toBe("/dashboard?from=legacy");
    expect(clerkAuthRoutes.signUpForceRedirectUrl).toBe("/dashboard");
    expect(clerkAuthRoutes.signUpFallbackRedirectUrl).toBe("/dashboard/welcome");
  });
});
