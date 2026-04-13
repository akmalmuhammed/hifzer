const DEFAULT_SITE_URL = "https://www.hifzer.com";

export function getSiteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    DEFAULT_SITE_URL;

  try {
    const parsed = new URL(raw);
    if (process.env.VERCEL_ENV === "production" && parsed.hostname.endsWith(".vercel.app")) {
      return new URL(DEFAULT_SITE_URL);
    }
    if (process.env.VERCEL_ENV === "production" && parsed.hostname === "hifzer.com") {
      return new URL(DEFAULT_SITE_URL);
    }
    return parsed;
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}
