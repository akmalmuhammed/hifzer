"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export type InstallRequestResult =
  | "accepted"
  | "dismissed"
  | "ios_instructions"
  | "unavailable";

function isIosSafari(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const ua = window.navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(ua);
}

export function useInstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => isStandaloneMode());
  const [iosSafari] = useState<boolean>(() => !isStandaloneMode() && isIosSafari());
  const [mobile] = useState<boolean>(() => isMobileDevice());

  useEffect(() => {
    if (installed) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  const canPrompt = Boolean(deferredPrompt);
  const canShowCta = !installed && (canPrompt || iosSafari);

  const requestInstall = useCallback(async (): Promise<InstallRequestResult> => {
    if (installed) {
      return "unavailable";
    }
    if (!deferredPrompt) {
      return iosSafari ? "ios_instructions" : "unavailable";
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
      return "accepted";
    }
    setDeferredPrompt(null);
    return "dismissed";
  }, [deferredPrompt, installed, iosSafari]);

  return useMemo(
    () => ({
      mobile,
      installed,
      iosSafari,
      canPrompt,
      canShowCta,
      requestInstall,
    }),
    [canPrompt, canShowCta, installed, iosSafari, mobile, requestInstall],
  );
}
