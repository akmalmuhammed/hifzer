import Link from "next/link";
import { Bell, Eye, Languages, LifeBuoy, Map, Palette, SlidersHorizontal, Target, UserRound, Volume2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import { getUiLanguageServer } from "@/hifzer/i18n/server";

export const metadata = {
  title: "Settings",
};

function getItems(copy: ReturnType<typeof getAppUiCopy>) {
  return [
    {
      href: "/settings/plan",
      title: "Plan",
      desc: "Set your daily time, weekly rhythm, and study pace.",
      icon: <SlidersHorizontal size={18} />,
      tone: "brand" as const,
    },
    {
      href: "/settings/display",
      title: "Display",
      desc: "Choose your mode, theme, and highlight color.",
      icon: <Palette size={18} />,
      tone: "accent" as const,
    },
    {
      href: "/settings/language",
      title: copy.languageSettings.title,
      desc: copy.languageSettings.subtitle,
      icon: <Languages size={18} />,
      tone: "accent" as const,
    },
    {
      href: "/settings/account",
      title: "Account",
      desc: "Profile, password, and deletion.",
      icon: <UserRound size={18} />,
      tone: "neutral" as const,
    },
    {
      href: "/settings/reminders",
      title: "Reminders",
      desc: "Email reminder timing and opt-in controls.",
      icon: <Bell size={18} />,
      tone: "warn" as const,
    },
    {
      href: "/settings/privacy",
      title: "Privacy",
      desc: "Manage what stays private and what you keep on this account.",
      icon: <Eye size={18} />,
      tone: "neutral" as const,
    },
    {
      href: "/settings/reciter",
      title: "Reciter",
      desc: "Choose your preferred voice and playback style.",
      icon: <Volume2 size={18} />,
      tone: "accent" as const,
    },
    {
      href: "/settings/scoring",
      title: "Scoring",
      desc: "Adjust how your review labels feel during practice.",
      icon: <Target size={18} />,
      tone: "brand" as const,
    },
    {
      href: "/settings/thresholds",
      title: "Thresholds",
      desc: "Fine-tune how strict or gentle the learning flow feels.",
      icon: <SlidersHorizontal size={18} />,
      tone: "warn" as const,
    },
    {
      href: "/roadmap",
      title: copy.nav.roadmap,
      desc: "See what the team is building next for daily Qur'an practice.",
      icon: <Map size={18} />,
      tone: "accent" as const,
    },
    {
      href: "/support",
      title: copy.nav.support,
      desc: "Send feedback, ask for help, or share what should improve next.",
      icon: <LifeBuoy size={18} />,
      tone: "brand" as const,
    },
  ] as const;
}

export default async function SettingsPage() {
  const language = await getUiLanguageServer();
  const copy = getAppUiCopy(language);
  const items = getItems(copy);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={copy.settingsPage.eyebrow}
        title={copy.settingsPage.title}
        subtitle={copy.settingsPage.subtitle}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="group transition hover:bg-white/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Pill tone={item.tone}>{item.title}</Pill>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">{item.desc}</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
                  {item.icon}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
