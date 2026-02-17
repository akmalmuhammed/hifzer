function envOrDefault(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : fallback;
}

export const clerkAuthRoutes = {
  signInUrl: envOrDefault("NEXT_PUBLIC_CLERK_SIGN_IN_URL", "/login"),
  signUpUrl: envOrDefault("NEXT_PUBLIC_CLERK_SIGN_UP_URL", "/signup"),
  signInForceRedirectUrl: envOrDefault("NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL", "/today"),
  signInFallbackRedirectUrl: envOrDefault("NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL", "/today"),
  signUpForceRedirectUrl: envOrDefault("NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL", "/today"),
  signUpFallbackRedirectUrl: envOrDefault("NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL", "/today"),
} as const;

