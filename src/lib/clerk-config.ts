function hasValue(value: string | undefined): value is string {
  return Boolean(value && value.trim());
}

function looksPlaceholder(value: string): boolean {
  return /(replace_with|placeholder|example|your_|changeme)/i.test(value);
}

export function clerkEnabled(): boolean {
  // SECURITY: Auth bypass is only allowed in non-production environments.
  // Setting this in production would expose every protected route publicly.
  if (process.env.HIFZER_TEST_AUTH_BYPASS === "1") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "HIFZER_TEST_AUTH_BYPASS=1 is not permitted in production. " +
          "Remove this environment variable from your production deployment."
      );
    }
    return false;
  }

  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!hasValue(publishableKey) || !hasValue(secretKey)) {
    return false;
  }
  if (looksPlaceholder(publishableKey) || looksPlaceholder(secretKey)) {
    return false;
  }
  return true;
}

