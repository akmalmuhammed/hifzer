"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Download, Share, X } from "lucide-react";
import {
  buildDismissedUntil,
  INSTALL_BANNER_DISMISSED_UNTIL_KEY,
  INSTALL_BANNER_SEEN_KEY,
  parseDismissedUntil,
  shouldShowInstallBanner,
} from "@/components/pwa/install-banner-state";
import { useInstallApp } from "@/components/pwa/use-install-app";

const installBannerEnabled = process.env.NEXT_PUBLIC_INSTALL_BANNER_ENABLED === "1";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in restricted browsing modes.
  }
}

export function InstallAppBanner({ className }: { className?: string }) {
  const install = useInstallApp();
  const [nowMs] = useState<number>(() => Date.now());
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(() =>
    parseDismissedUntil(readStorage(INSTALL_BANNER_DISMISSED_UNTIL_KEY)),
  );

  const visible = useMemo(
    () =>
      shouldShowInstallBanner({
        enabled: installBannerEnabled,
        isMobile: install.mobile,
        installed: install.installed,
        canShowInstallCta: install.canShowCta,
        dismissedUntil,
        nowMs,
      }),
    [dismissedUntil, install.canShowCta, install.installed, install.mobile, nowMs],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    writeStorage(INSTALL_BANNER_SEEN_KEY, "1");
  }, [visible]);

  if (!visible) {
    return null;
  }

  const title = install.canPrompt ? "Install Hifzer app" : "Add Hifzer to Home Screen";
  const hint = install.canPrompt
    ? "Get faster launch and app-style full-screen on mobile."
    : showIosSteps
      ? "Step 1: tap Share. Step 2: choose Add to Home Screen."
      : "On iPhone Safari, open Share and tap Add to Home Screen.";
  const Icon = install.canPrompt ? Download : Share;

  const dismiss = () => {
    const until = buildDismissedUntil(Date.now());
    setDismissedUntil(until);
    writeStorage(INSTALL_BANNER_DISMISSED_UNTIL_KEY, String(until));
  };

  const onInstall = async () => {
    const result = await install.requestInstall();
    if (result === "ios_instructions") {
      setShowIosSteps(true);
      return;
    }
    if (result === "dismissed") {
      setShowIosSteps(false);
    }
  };

  return (
    <div
      className={clsx(
        "fixed left-1/2 z-50 w-[min(640px,calc(100vw-1rem))] -translate-x-1/2 md:hidden",
        className,
      )}
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 6.5rem)" }}
      role="region"
      aria-label="Install app"
    >
      <div className="rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.24)] bg-white/92 px-3 py-3 shadow-[var(--kw-shadow)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{title}</p>
            <p className="mt-1 text-xs leading-5 text-[color:var(--kw-muted)]">{hint}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1 text-[color:var(--kw-faint)] transition hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]"
            aria-label="Dismiss install banner"
            title="Dismiss install banner"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              void onInstall();
            }}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] transition hover:bg-[rgba(var(--kw-accent-rgb),0.16)]"
          >
            <Icon size={15} />
            {install.canPrompt ? "Install app" : "How to add"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] px-3 text-sm font-semibold text-[color:var(--kw-muted)] transition hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
