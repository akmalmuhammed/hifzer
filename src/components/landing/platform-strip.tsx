"use client";

import { useState } from "react";
import clsx from "clsx";
import { Download, Monitor, Smartphone } from "lucide-react";
import { IphoneInstallGuide } from "@/components/landing/iphone-install-guide";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { useInstallApp } from "@/components/pwa/use-install-app";

type PlatformId = "iphone" | "android" | "web";

const PLATFORMS: Array<{
  id: PlatformId;
  icon: typeof Smartphone | typeof Monitor;
  label: string;
  sub: string;
}> = [
  {
    id: "iphone",
    icon: Smartphone,
    label: "iPhone",
    sub: "Tap for the latest Safari and Chrome add-to-home-screen steps.",
  },
  {
    id: "android",
    icon: Smartphone,
    label: "Android",
    sub: "Tap to trigger install when Chrome has the prompt ready.",
  },
  {
    id: "web",
    icon: Monitor,
    label: "Web app",
    sub: "Use Hifzer in the browser if you do not want to install anything.",
  },
] as const;

function WebGuide() {
  return (
    <div className="rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/72 p-4 shadow-[var(--kw-shadow-soft)] backdrop-blur-sm md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="neutral">No install required</Pill>
        <Pill tone="brand">Browser first</Pill>
      </div>
      <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
        Hifzer already works as a normal web app.
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--kw-muted)]">
        If you prefer, stay in the browser. Your reading place, hifz flow, and private features still work without adding anything to your home screen.
      </p>
    </div>
  );
}

function AndroidGuide(props: { canInstall: boolean; onInstall: () => void }) {
  return (
    <div className="rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/72 p-4 shadow-[var(--kw-shadow-soft)] backdrop-blur-sm md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="brand">Android install</Pill>
        <Pill tone={props.canInstall ? "accent" : "neutral"}>
          {props.canInstall ? "Prompt ready" : "Open in Chrome on Android"}
        </Pill>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
            Install from Chrome when the prompt is available.
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
            Hifzer uses the normal Android install prompt. If you are in Chrome on Android and install is available, tapping Android above or the button below will open it.
          </p>
          <ol className="mt-4 space-y-2 text-sm leading-6 text-[color:var(--kw-ink-2)]">
            <li>1. Open this page in Chrome on Android.</li>
            <li>2. Tap Android here to trigger the browser install prompt.</li>
            <li>3. If Chrome does not prompt yet, use the browser menu when Install app becomes available.</li>
          </ol>
        </div>

        <Button
          size="lg"
          className="gap-2"
          onClick={props.onInstall}
          disabled={!props.canInstall}
        >
          <Download size={18} />
          Install on Android
        </Button>
      </div>
    </div>
  );
}

export function PlatformStrip() {
  const [activePlatform, setActivePlatform] = useState<PlatformId>("iphone");
  const install = useInstallApp();
  const { pushToast } = useToast();

  async function triggerAndroidInstall() {
    if (!install.canShowCta) {
      pushToast({
        title: "Open Hifzer in Chrome on Android",
        message: "When install is available, Chrome will show the prompt or expose Install app in the browser menu.",
        tone: "neutral",
      });
      return;
    }

    const result = await install.requestInstall();
    if (result === "dismissed") {
      pushToast({
        title: "Install dismissed",
        message: "You can tap Android again whenever you are ready to install.",
        tone: "neutral",
      });
    }
  }

  async function handlePlatformSelect(platformId: PlatformId) {
    setActivePlatform(platformId);

    if (platformId === "android") {
      await triggerAndroidInstall();
    }
  }

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <div className="text-center">
          <h2 className="kw-marketing-display text-2xl text-[color:var(--kw-ink)] sm:text-3xl">
            Start in the browser. Install later if you want.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--kw-muted)]">
            Hifzer works in any modern browser. Use the web app first, then add it to your home screen only if it earns the space.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLATFORMS.map(({ id, icon: Icon, label, sub }) => {
            const active = id === activePlatform;

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  void handlePlatformSelect(id);
                }}
                aria-pressed={active}
                className={clsx(
                  "flex items-start gap-4 rounded-[20px] border px-5 py-5 text-left backdrop-blur-sm transition sm:flex-col sm:items-center sm:text-center",
                  active
                    ? "border-[rgba(var(--kw-accent-rgb),0.24)] bg-[rgba(var(--kw-accent-rgb),0.08)] shadow-[var(--kw-shadow-soft)]"
                    : "border-[color:var(--kw-border-2)] bg-white/60 hover:bg-white/80",
                )}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-accent)]">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="font-bold text-[color:var(--kw-ink)]">{label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[color:var(--kw-muted)]">{sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {activePlatform === "iphone" ? <IphoneInstallGuide /> : null}
          {activePlatform === "android" ? (
            <AndroidGuide
              canInstall={install.canShowCta}
              onInstall={() => {
                void triggerAndroidInstall();
              }}
            />
          ) : null}
          {activePlatform === "web" ? <WebGuide /> : null}
        </div>
      </div>
    </section>
  );
}
