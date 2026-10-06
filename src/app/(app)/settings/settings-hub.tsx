"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Languages,
  Link2,
  Palette,
  SlidersHorizontal,
  UserRound,
  Volume2,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

type SettingsTabKey = "learning" | "display" | "account" | "integrations";
type PillTone = "neutral" | "brand" | "accent" | "warn" | "success" | "danger";

type SettingsHubProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  languageTitle: string;
  languageDesc: string;
};

type SettingsItem = {
  href: string;
  group: SettingsTabKey;
  title: string;
  desc: string;
  eyebrow: string;
  icon: LucideIcon;
  tone: PillTone;
};

const TAB_META: Record<SettingsTabKey, { label: string; desc: string; tone: PillTone }> = {
  learning: {
    label: "Learning",
    desc: "Plan, language, and audio.",
    tone: "accent",
  },
  display: {
    label: "Display",
    desc: "Theme and color.",
    tone: "brand",
  },
  account: {
    label: "Account",
    desc: "Profile and reminders.",
    tone: "neutral",
  },
  integrations: {
    label: "Integrations",
    desc: "Linked services.",
    tone: "warn",
  },
};

function getItems(props: SettingsHubProps): SettingsItem[] {
  return [
    {
      href: "/settings/plan",
      group: "learning",
      title: "Learning plan",
      desc: "Time, days, and focus.",
      eyebrow: "Core",
      icon: SlidersHorizontal,
      tone: "brand",
    },
    {
      href: "/settings/language",
      group: "learning",
      title: props.languageTitle,
      desc: props.languageDesc,
      eyebrow: "Reading",
      icon: Languages,
      tone: "accent",
    },
    {
      href: "/settings/reciter",
      group: "learning",
      title: "Reciter",
      desc: "Default voice and audio route.",
      eyebrow: "Audio",
      icon: Volume2,
      tone: "accent",
    },
    {
      href: "/settings/display",
      group: "display",
      title: "Display",
      desc: "Mode, theme, and accent.",
      eyebrow: "Theme",
      icon: Palette,
      tone: "accent",
    },
    {
      href: "/settings/account",
      group: "account",
      title: "Account",
      desc: "Profile and sign out.",
      eyebrow: "Identity",
      icon: UserRound,
      tone: "neutral",
    },
    {
      href: "/settings/reminders",
      group: "account",
      title: "Reminders",
      desc: "Email timing.",
      eyebrow: "Schedule",
      icon: Bell,
      tone: "warn",
    },
    {
      href: "/settings/quran-foundation",
      group: "integrations",
      title: "Quran.com",
      desc: "Link and sync.",
      eyebrow: "Connected",
      icon: Link2,
      tone: "brand",
    },
  ];
}

export function SettingsHub(props: SettingsHubProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("learning");
  const items = useMemo(() => getItems(props), [props]);
  const activeItems = items.filter((item) => item.group === activeTab);
  const activeMeta = TAB_META[activeTab];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={props.eyebrow}
        title={props.title}
        subtitle={props.subtitle}
      />

      <div
        className="flex w-full gap-1 overflow-x-auto rounded-full bg-[color:var(--kw-fill-strong)] p-1 sm:inline-flex sm:w-auto"
        role="tablist"
        aria-label="Settings groups"
      >
        {(Object.entries(TAB_META) as Array<[SettingsTabKey, typeof TAB_META[SettingsTabKey]]>).map(([key, meta]) => {
          const active = key === activeTab;
          const count = items.filter((item) => item.group === key).length;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`settings-tab-${key}`}
              aria-selected={active}
              aria-controls={`settings-panel-${key}`}
              onClick={() => setActiveTab(key)}
              className={[
                "min-h-11 flex-1 rounded-full px-4 py-2 text-left transition-colors duration-200 sm:min-w-[132px] sm:flex-none",
                active
                  ? "bg-[color:var(--kw-card)] shadow-[var(--kw-shadow-soft)]"
                  : "bg-transparent hover:bg-[color:var(--kw-hover-soft)]",
              ].join(" ")}
            >
              <div className="flex items-center justify-center gap-2">
                <Pill tone={active ? meta.tone : "neutral"} className="whitespace-nowrap border-0! bg-transparent! px-0! py-0! text-[0.92rem]! text-[color:var(--kw-ink)]!">{meta.label}</Pill>
                <span className="text-xs font-medium tabular-nums text-[color:var(--kw-faint)]">{count}</span>
              </div>
              <p className="sr-only">{meta.desc}</p>
            </button>
          );
        })}
      </div>

      <section
        id={`settings-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`settings-tab-${activeTab}`}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4 px-4">
          <Pill tone={activeMeta.tone} className="border-0! bg-transparent! px-0! py-0! text-[0.86rem]! font-medium! text-[color:var(--kw-faint)]!">{activeMeta.label}</Pill>
          <Pill tone="neutral" className="border-0! bg-transparent! px-0! py-0! text-[0.86rem]! font-normal! tabular-nums text-[color:var(--kw-faint)]!">{activeItems.length} pages</Pill>
        </div>

        <div className="overflow-hidden rounded-[var(--kw-radius-xl)] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-card)] [&>a+a>div]:border-t!">
          {activeItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <Card className="group flex min-h-[4.25rem] items-center gap-3 rounded-none! border-0! border-[color:var(--kw-border-2)]! bg-transparent! py-3! shadow-none! transition-colors duration-200 after:h-2 after:w-2 after:shrink-0 after:rotate-45 after:border-r-2 after:border-t-2 after:border-[color:var(--kw-faint)] after:opacity-60 after:content-[''] hover:bg-[color:var(--kw-hover-soft)]!">
                  <div className="flex min-w-0 flex-1 flex-row-reverse items-center justify-end gap-3.5">
                    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3">
                      <Pill tone={item.tone} className="col-start-2 row-span-2 row-start-1 border-0! bg-transparent! px-0! py-0! text-[0.92rem]! font-normal! text-[color:var(--kw-faint)]!">{item.eyebrow}</Pill>
                      <p className="col-start-1 row-start-1 text-[1rem] font-medium tracking-[-0.01em] text-[color:var(--kw-ink)]">
                        {item.title}
                      </p>
                      <p className="col-start-1 row-start-2 truncate text-sm leading-6 text-[color:var(--kw-faint)]">{item.desc}</p>
                    </div>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[rgba(var(--kw-accent-rgb),1)] text-white">
                      <Icon size={18} />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
