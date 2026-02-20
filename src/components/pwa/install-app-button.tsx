"use client";

import clsx from "clsx";
import { Download, Share } from "lucide-react";
import { useInstallApp } from "@/components/pwa/use-install-app";
import { useToast } from "@/components/ui/toast";

export function InstallAppButton({ className }: { className?: string }) {
  const install = useInstallApp();
  const { pushToast } = useToast();

  if (!install.canShowCta) {
    return null;
  }

  async function onInstall() {
    const result = await install.requestInstall();
    if (result === "ios_instructions") {
      pushToast({
        title: "Install on iPhone",
        message: "Open Share menu, then choose Add to Home Screen.",
      });
      return;
    }
  }

  const label = install.canPrompt ? "Install app" : "Add to Home";
  const Icon = install.canPrompt ? Download : Share;

  return (
    <button
      type="button"
      onClick={() => {
        void onInstall();
      }}
      className={clsx(
        "max-w-full rounded-full border border-[rgba(var(--kw-accent-rgb),0.24)] bg-white/85 px-3 py-2 text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] backdrop-blur transition hover:bg-white",
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
