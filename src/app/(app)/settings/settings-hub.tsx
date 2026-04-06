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
    desc: "Plan, translation, audio, and study rhythm.",
    tone: "accent",
  },
  display: {
    label: "Display",
    desc: "Theme, color, and mode preferences.",
    tone: "brand",
  },
  account: {
    label: "Account",
    desc: "Identity, reminders, and sign-in state.",
    tone: "neutral",
  },
  integrations: {
    label: "Integrations",
    desc: "Connected services and bookmark sync.",
    tone: "warn",
  },
};

function getItems(props: SettingsHubProps): SettingsItem[] {
  return [
    {
      href: "/settings/plan",
      group: "learning",
      title: "Learning plan",
      desc: "Daily minutes, weekly rhythm, plan bias, and teacher support.",
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
      desc: "Choose the default voice used across reader and Hifz playback.",
      eyebrow: "Audio",
      icon: Volume2,
      tone: "accent",
    },
    {
      href: "/settings/display",
      group: "display",
      title: "Display",
      desc: "Theme presets, accent color, and light or dark mode.",
      eyebrow: "Theme",
      icon: Palette,
      tone: "accent",
    },
    {
      href: "/settings/account",
      group: "account",
      title: "Account",
      desc: "Profile identity and sign-out controls through Clerk.",
      eyebrow: "Identity",
      icon: UserRound,
      tone: "neutral",
    },
    {
      href: "/settings/reminders",
      group: "account",
      title: "Reminders",
      desc: "Email reminder timing and whether daily reminders are enabled.",
      eyebrow: "Schedule",
      icon: Bell,
      tone: "warn",
    },
    {
      href: "/settings/quran-foundation",
      group: "integrations",
      title: "Quran.com",
      desc: "Link your Quran.com account for bookmark sync and enrichment.",
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

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Pill tone="accent">Focused settings</Pill>
              <Pill tone="neutral">{items.length} live pages</Pill>
            </div>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              Only settings with real, current behavior stay here. Product notes, roadmap items, and non-configurable engine explanations have been removed so this hub stays specific and easier to scan on mobile.
            </p>
          </div>
        </div>
      </Card>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
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
                "min-w-[190px] rounded-[20px] border px-4 py-3 text-left transition",
                active
                  ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] shadow-[0_16px_30px_rgba(11,18,32,0.08)]"
                  : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <Pill tone={active ? meta.tone : "neutral"}>{meta.label}</Pill>
                <span className="text-xs font-semibold text-[color:var(--kw-faint)]">{count}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--kw-muted)]">{meta.desc}</p>
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <Pill tone={activeMeta.tone}>{activeMeta.label}</Pill>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{activeMeta.desc}</p>
          </div>
          <Pill tone="neutral">{activeItems.length} pages</Pill>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="group h-full transition hover:bg-white/60">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Pill tone={item.tone}>{item.eyebrow}</Pill>
                      <p className="mt-3 text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{item.desc}</p>
                    </div>
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
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
