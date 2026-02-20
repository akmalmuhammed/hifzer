import { describe, expect, it } from "vitest";
import {
  buildDismissedUntil,
  parseDismissedUntil,
  shouldShowInstallBanner,
} from "@/components/pwa/install-banner-state";

describe("install-banner-state", () => {
  it("parses dismissed-until timestamp safely", () => {
    expect(parseDismissedUntil(null)).toBeNull();
    expect(parseDismissedUntil("")).toBeNull();
    expect(parseDismissedUntil("abc")).toBeNull();
    expect(parseDismissedUntil("-42")).toBeNull();
    expect(parseDismissedUntil("1735603200123")).toBe(1735603200123);
  });

  it("builds a future dismissed-until value", () => {
    const now = 1000;
    const next = buildDismissedUntil(now, 7);
    expect(next).toBe(1000 + (7 * 24 * 60 * 60 * 1000));
  });

  it("shows install banner only when all eligibility checks pass", () => {
    const now = Date.now();
    expect(
      shouldShowInstallBanner({
        enabled: false,
        isMobile: true,
        installed: false,
        canShowInstallCta: true,
        dismissedUntil: null,
        nowMs: now,
      }),
    ).toBe(false);

    expect(
      shouldShowInstallBanner({
        enabled: true,
        isMobile: false,
        installed: false,
        canShowInstallCta: true,
        dismissedUntil: null,
        nowMs: now,
      }),
    ).toBe(false);

    expect(
      shouldShowInstallBanner({
        enabled: true,
        isMobile: true,
        installed: true,
        canShowInstallCta: true,
        dismissedUntil: null,
        nowMs: now,
      }),
    ).toBe(false);

    expect(
      shouldShowInstallBanner({
        enabled: true,
        isMobile: true,
        installed: false,
        canShowInstallCta: false,
        dismissedUntil: null,
        nowMs: now,
      }),
    ).toBe(false);

    expect(
      shouldShowInstallBanner({
        enabled: true,
        isMobile: true,
        installed: false,
        canShowInstallCta: true,
        dismissedUntil: now + 10_000,
        nowMs: now,
      }),
    ).toBe(false);

    expect(
      shouldShowInstallBanner({
        enabled: true,
        isMobile: true,
        installed: false,
        canShowInstallCta: true,
        dismissedUntil: now - 1,
        nowMs: now,
      }),
    ).toBe(true);
  });
});
