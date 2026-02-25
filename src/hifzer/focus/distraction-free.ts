export const DISTRACTION_FREE_COOKIE = "hifzer_distraction_free";
export const DISTRACTION_FREE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function normalizeDistractionFree(value: unknown): boolean {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "on";
}

export function buildDistractionFreeCookieValue(enabled: boolean): string {
  return `${DISTRACTION_FREE_COOKIE}=${enabled ? "1" : "0"}; Path=/; Max-Age=${DISTRACTION_FREE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
