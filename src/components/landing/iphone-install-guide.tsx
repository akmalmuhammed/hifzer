"use client";

import { useState } from "react";
import clsx from "clsx";
import { ExternalLink, Share } from "lucide-react";
import { Pill } from "@/components/ui/pill";

const BROWSERS = [
  {
    id: "safari",
    label: "Safari",
    eyebrow: "Apple route",
    intro: "Best fit if you want the cleanest iPhone web-app flow.",
    detail:
      "Safari supports Add to Home Screen directly, and iPhone can optionally open the saved shortcut as a web app.",
    supportHref: "https://support.apple.com/guide/iphone/bookmark-a-website-in-safari-on-iphone-iph42ab2f3a7/ios",
    supportLabel: "Apple iPhone User Guide",
    steps: [
      "Open Hifzer in Safari on your iPhone.",
      "Open the page actions: tap Share if you see it, or tap More first if Safari is showing More instead.",
      "Scroll down and tap Add to Home Screen. If it is missing, tap Edit Actions and add it.",
      "Optional: turn on Open as Web App if iPhone offers it.",
      "Tap Add to place Hifzer on your Home Screen.",
    ],
  },
  {
    id: "chrome",
    label: "Chrome",
    eyebrow: "Google route",
    intro: "Useful if Chrome is the browser you already return to on iPhone.",
    detail:
      "Chrome on iPhone can also create a Home Screen shortcut from the share menu without sending you to an app store.",
    supportHref: "https://support.google.com/chrome/answer/15085120?co=GENIE.Platform%3DiOS&hl=en",
    supportLabel: "Chrome Help",
    steps: [
      "Open Hifzer in Chrome on your iPhone.",
      "Tap Share on the right side of the address bar.",
      "Tap Add to Home Screen.",
      "Edit the shortcut name if you want.",
      "Tap Add to place the shortcut on your Home Screen.",
    ],
  },
] as const;

type BrowserId = (typeof BROWSERS)[number]["id"];

export function IphoneInstallGuide() {
  const [browser, setBrowser] = useState<BrowserId>("safari");
  const activeBrowser = BROWSERS.find((item) => item.id === browser) ?? BROWSERS[0];

  return (
    <div className="rounded-[24px] border border-[color:var(--kw-border-2)] bg-white/72 p-4 shadow-[var(--kw-shadow-soft)] backdrop-blur-sm md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">iPhone install guide</Pill>
            <Pill tone="neutral">Step by step</Pill>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
            Choose the browser you use on iPhone.
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">
            Both Safari and Chrome can save Hifzer to your Home Screen today. The steps are slightly different, so we keep them separate here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {BROWSERS.map((item) => {
            const active = item.id === activeBrowser.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setBrowser(item.id)}
                aria-pressed={active}
                className={clsx(
                  "rounded-full border px-3 py-2 text-sm font-semibold transition",
                  active
                    ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                    : "border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-hover-soft)]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-[rgba(var(--kw-accent-rgb),1)]">
              <Share size={16} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                {activeBrowser.eyebrow}
              </p>
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{activeBrowser.intro}</p>
            </div>
          </div>

          <ol className="mt-4 space-y-3">
            {activeBrowser.steps.map((step, index) => (
              <li
                key={step}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/78 px-3 py-3"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(var(--kw-accent-rgb),0.2)] bg-[rgba(var(--kw-accent-rgb),0.08)] text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-[color:var(--kw-ink-2)]">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/78 px-4 py-4">
          <Pill tone="brand">What changes</Pill>
          <p className="mt-3 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {activeBrowser.label} on iPhone
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--kw-muted)]">{activeBrowser.detail}</p>

            <div className="mt-4 rounded-[18px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.07)] px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(var(--kw-accent-rgb),1)]">
                Official guide
              </p>
            <a
              href={activeBrowser.supportHref}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)] hover:underline"
            >
              {activeBrowser.supportLabel} <ExternalLink size={14} />
            </a>
          </div>

          <p className="mt-4 text-xs leading-5 text-[color:var(--kw-faint)]">
            If you mostly use Safari, use the Safari path. If you live in Chrome on iPhone, the Chrome path is now available too.
          </p>
        </div>
      </div>
    </div>
  );
}
