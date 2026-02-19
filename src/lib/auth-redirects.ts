function envOrDefault(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : fallback;
}

function asSafePath(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

function envPathOrDefault(key: string, fallback: string): string {
  return asSafePath(envOrDefault(key, fallback), fallback);
}

function normalizeAuthEntryPath(path: string, fallback: "/login" | "/signup"): string {
  // `/sign-in` is reserved for legacy demo auth in this app.
  if (path === "/sign-in") {
    return "/login";
  }
  if (path === "/sign-up") {
    return "/signup";
  }
  return asSafePath(path, fallback);
}

export const clerkAuthRoutes = {
  signInUrl: normalizeAuthEntryPath(envPathOrDefault("NEXT_PUBLIC_CLERK_SIGN_IN_URL", "/login"), "/login"),
  signUpUrl: normalizeAuthEntryPath(envPathOrDefault("NEXT_PUBLIC_CLERK_SIGN_UP_URL", "/signup"), "/signup"),
  signInForceRedirectUrl: envPathOrDefault("NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL", "/today"),
  signInFallbackRedirectUrl: envPathOrDefault("NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL", "/today"),
  signUpForceRedirectUrl: envPathOrDefault("NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL", "/today"),
  signUpFallbackRedirectUrl: envPathOrDefault("NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL", "/today"),
} as const;
