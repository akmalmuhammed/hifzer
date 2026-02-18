import { beforeEach, describe, expect, it } from "vitest";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token.server";

function primeEnv() {
  process.env.RESEND_API_KEY = "re_test_123";
  process.env.EMAIL_FROM = "Hifzer <noreply@example.com>";
  process.env.EMAIL_UNSUBSCRIBE_SIGNING_SECRET = "secret_test_value";
  process.env.CRON_SECRET = "cron_secret";
  process.env.NEXT_PUBLIC_APP_URL = "https://hifzer.test";
}

describe("email/unsubscribe-token", () => {
  beforeEach(() => {
    primeEnv();
  });

  it("creates and verifies a valid token", () => {
    const token = createUnsubscribeToken({
      clerkUserId: "user_123",
      expiresAt: new Date(Date.now() + (60 * 60 * 1000)),
    });
    const out = verifyUnsubscribeToken(token);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.clerkUserId).toBe("user_123");
    }
  });

  it("rejects tampered tokens", () => {
    const token = createUnsubscribeToken({
      clerkUserId: "user_123",
      expiresAt: new Date(Date.now() + (60 * 60 * 1000)),
    });
    const tampered = `${token}x`;
    const out = verifyUnsubscribeToken(tampered);
    expect(out.ok).toBe(false);
  });

  it("rejects expired tokens", () => {
    const token = createUnsubscribeToken({
      clerkUserId: "user_123",
      expiresAt: new Date(Date.now() - (60 * 1000)),
    });
    const out = verifyUnsubscribeToken(token);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.reason).toBe("expired");
    }
  });
});
