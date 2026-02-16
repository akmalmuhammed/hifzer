function hasValue(value: string | undefined): value is string {
  return Boolean(value && value.trim());
}

function looksPlaceholder(value: string): boolean {
  return /(replace_with|placeholder|example|your_|changeme)/i.test(value);
}

export function clerkEnabled(): boolean {
  if (process.env.HIFZER_TEST_AUTH_BYPASS === "1") {
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

