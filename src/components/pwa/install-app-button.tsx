"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Download, Share } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isIosSafari(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || Boolean(navigatorWithStandalone.standalone);
}

export function InstallAppButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());
  const [showIosHelp, setShowIosHelp] = useState<boolean>(() => !isStandalone() && isIosSafari());
  const { pushToast } = useToast();

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
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  if (installed) {
    return null;
  }

  if (!deferredPrompt && !showIosHelp) {
    return null;
  }

  async function onInstall() {
    if (!deferredPrompt) {
      pushToast({
        title: "Install on iPhone",
        message: "Open Share menu, then choose Add to Home Screen.",
      });
      return;
    }

    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    setDeferredPrompt(null);
  }

  const label = deferredPrompt ? "Install app" : "Add to Home";
  const Icon = deferredPrompt ? Download : Share;

  return (
    <button
      type="button"
      onClick={() => {
        void onInstall();
      }}
      className={clsx(
        "rounded-full border border-[rgba(var(--kw-accent-rgb),0.24)] bg-white/85 px-3 py-2 text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] backdrop-blur transition hover:bg-white",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <span className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]">
          <Icon size={14} />
        </span>
        <span className="text-sm font-semibold leading-none">{label}</span>
      </span>
    </button>
  );
}
