export const INSTALL_BANNER_DISMISSED_UNTIL_KEY = "hifzer_install_banner_dismissed_until_v1";
export const INSTALL_BANNER_SEEN_KEY = "hifzer_install_banner_seen_v1";
export const INSTALL_BANNER_DISMISS_DAYS = 7;

export function parseDismissedUntil(raw: string | null): number | null {
  if (!raw) {
    return null;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.floor(value);
}

export function buildDismissedUntil(nowMs: number, days = INSTALL_BANNER_DISMISS_DAYS): number {
  const durationMs = Math.max(1, days) * 24 * 60 * 60 * 1000;
  return Math.floor(nowMs + durationMs);
}

export function shouldShowInstallBanner(input: {
  enabled: boolean;
  isMobile: boolean;
  installed: boolean;
  canShowInstallCta: boolean;
  dismissedUntil: number | null;
  nowMs: number;
}): boolean {
  if (!input.enabled || !input.isMobile || input.installed || !input.canShowInstallCta) {
    return false;
  }
  if (input.dismissedUntil == null) {
    return true;
  }
  return input.dismissedUntil <= input.nowMs;
}
