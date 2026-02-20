"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  BookOpenText,
  CalendarDays,
  ChevronDown,
  House,
  LifeBuoy,
  LibraryBig,
  Map,
  PlayCircle,
  Settings,
  TrendingUp,
  Flame,
} from "lucide-react";
import { HifzerMark } from "@/components/brand/hifzer-mark";
import { StreakCornerBadge } from "@/components/app/streak-corner-badge";
import { TrackedLink } from "@/components/telemetry/tracked-link";

type NavItem = { href: string; label: string; icon: typeof House };

const PRIMARY: NavItem[] = [
  { href: "/welcome", label: "Home", icon: House },
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/session", label: "Session", icon: PlayCircle },
  { href: "/quran", label: "Qur'an", icon: BookOpenText },
];

const INSIGHTS: NavItem[] = [
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/streak", label: "Streak", icon: Flame },
  { href: "/quran/glossary", label: "Glossary", icon: LibraryBig },
];

const PLATFORM: NavItem[] = [
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

const MOBILE_NAV: NavItem[] = [
  { href: "/welcome", label: "Home", icon: House },
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/session", label: "Session", icon: PlayCircle },
  { href: "/quran", label: "Qur'an", icon: BookOpenText },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/welcome") {
    return pathname === "/welcome";
  }
  if (href === "/today") {
    return pathname === "/" || pathname === "/today";
  }
  if (href === "/roadmap") {
    return pathname === "/roadmap";
  }
  if (href === "/support") {
    return pathname === "/support";
  }
  if (href === "/settings") {
    return pathname === "/settings" || pathname.startsWith("/settings/");
  }
  if (href === "/progress") {
    return pathname === "/progress" || pathname.startsWith("/progress/");
  }
  if (href === "/streak") {
    return pathname === "/streak";
  }
  if (href === "/quran/glossary") {
    return pathname === "/quran/glossary";
  }
  if (href === "/quran") {
    return pathname === "/quran" || pathname.startsWith("/quran/");
  }
  return pathname === href;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <TrackedLink
      key={item.href}
      href={item.href}
      telemetryName={`shell.nav.${item.label.toLowerCase()}`}
      className={clsx(
        "flex items-center gap-3 rounded-[18px] border px-3 py-2 text-sm font-semibold shadow-[var(--kw-shadow-soft)] transition",
        active
          ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[color:var(--kw-ink)]"
          : "border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] text-[color:var(--kw-muted)] hover:bg-[color:var(--kw-surface-strong)] hover:text-[color:var(--kw-ink)]",
      )}
    >
      <span
        className={clsx(
          "grid h-9 w-9 place-items-center rounded-2xl border bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)]",
          active ? "border-[rgba(var(--kw-accent-rgb),0.26)]" : "border-[color:var(--kw-border-2)]",
        )}
      >
        <Icon size={18} />
      </span>
      <span className="truncate">{item.label}</span>
    </TrackedLink>
  );
}

export function AppShell(props: { children: React.ReactNode; streakEnabled?: boolean }) {
  const pathname = usePathname();
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [platformOpen, setPlatformOpen] = useState(true);

  return (
    <div className="min-h-dvh">
      <StreakCornerBadge enabled={Boolean(props.streakEnabled)} />
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:flex md:gap-6">
        <aside className="hidden w-[240px] shrink-0 md:block">
          <div className="sticky top-6 space-y-4">
            <TrackedLink href="/today" className="flex items-center gap-3" telemetryName="shell.logo">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[color:var(--kw-surface-soft)] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)] backdrop-blur-md">
                <HifzerMark />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight text-[color:var(--kw-ink)]">Hifzer</p>
                <p className="text-xs text-[color:var(--kw-muted)]">Hifz operating system</p>
              </div>
            </TrackedLink>

            <nav className="space-y-1">
              {PRIMARY.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setInsightsOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-[14px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--kw-faint)] transition hover:text-[color:var(--kw-muted)]"
              >
                <span>Insights</span>
                <ChevronDown
                  size={14}
                  className={clsx("transition-transform", insightsOpen && "rotate-180")}
                />
              </button>
              {insightsOpen ? (
                <div className="space-y-1">
                  {INSIGHTS.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setPlatformOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-[14px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--kw-faint)] transition hover:text-[color:var(--kw-muted)]"
              >
                <span>Product</span>
                <ChevronDown
                  size={14}
                  className={clsx("transition-transform", platformOpen && "rotate-180")}
                />
              </button>
              {platformOpen ? (
                <div className="space-y-1">
                  {PLATFORM.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} />
                  ))}
                </div>
              ) : null}
            </div>

            <nav className="space-y-1">
              <NavLink
                item={{ href: "/settings", label: "Settings", icon: Settings }}
                pathname={pathname}
              />
            </nav>

          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 pb-24 md:pb-0">
          {props.children}
        </main>
      </div>

      <nav className="fixed bottom-3 left-1/2 z-40 w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-[26px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] px-2 py-2 shadow-[var(--kw-shadow)] backdrop-blur md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <TrackedLink
                key={item.href}
                href={item.href}
                telemetryName={`shell.mobile-nav.${item.label.toLowerCase()}`}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-semibold transition",
                  active
                    ? "bg-[rgba(var(--kw-accent-rgb),0.12)] text-[color:var(--kw-ink)]"
                    : "text-[color:var(--kw-muted)] hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]",
                )}
              >
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </TrackedLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
