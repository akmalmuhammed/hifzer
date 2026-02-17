import Link from "next/link";
import { Bell, Eye, GraduationCap, Palette, SlidersHorizontal, Target, UserRound, Volume2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Settings",
};

const ITEMS = [
  {
    href: "/settings/plan",
    title: "Plan",
    desc: "Time budget, practice days, and recalibration.",
    icon: <SlidersHorizontal size={18} />,
    tone: "brand" as const,
  },
  {
    href: "/settings/display",
    title: "Display",
    desc: "Dark mode, theme preset, and accent.",
    icon: <Palette size={18} />,
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
    desc: "Notification schedule (UI scaffold).",
    icon: <Bell size={18} />,
    tone: "warn" as const,
  },
  {
    href: "/settings/privacy",
    title: "Privacy",
    desc: "Retention controls, export, and delete policies.",
    icon: <Eye size={18} />,
    tone: "neutral" as const,
  },
  {
    href: "/settings/reciter",
    title: "Reciter",
    desc: "Audio voice profile and playback defaults.",
    icon: <Volume2 size={18} />,
    tone: "accent" as const,
  },
  {
    href: "/settings/scoring",
    title: "Scoring",
    desc: "Grade labels and scoring behavior for session reviews.",
    icon: <Target size={18} />,
    tone: "brand" as const,
  },
  {
    href: "/settings/teacher",
    title: "Teacher",
    desc: "Teacher collaboration placeholders and review controls.",
    icon: <GraduationCap size={18} />,
    tone: "neutral" as const,
  },
  {
    href: "/settings/thresholds",
    title: "Thresholds",
    desc: "SRS thresholds and queue tuning placeholders.",
    icon: <SlidersHorizontal size={18} />,
    tone: "warn" as const,
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        subtitle="Personalize Hifzer and tune your practice plan."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {ITEMS.map((item) => (
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
