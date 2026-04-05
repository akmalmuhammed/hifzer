"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  BookOpenText,
  CalendarDays,
  ChevronDown,
  House,
  LifeBuoy,
  LibraryBig,
  Map,
  MoonStar,
  PlayCircle,
  Settings,
  SquarePen,
} from "lucide-react";
import { HifzerMark } from "@/components/brand/hifzer-mark";
import { UiLanguageSwitcher } from "@/components/app/ui-language-switcher";
import { StreakCornerBadge } from "@/components/app/streak-corner-badge";
import { getAppUiCopy } from "@/hifzer/i18n/app-ui-copy";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { useUiLanguage } from "@/components/providers/ui-language-provider";

type NavKey =
  | "home"
  | "today"
  | "hifz"
  | "quran"
  | "dua"
  | "journal"
  | "progress"
  | "streak"
  | "glossary"
  | "roadmap"
  | "support"
  | "settings";

type NavItem = { href: string; key: NavKey; icon: typeof House; label?: string };

const PRIMARY: NavItem[] = [
  { href: "/", key: "home", icon: House },
  { href: "/today", key: "today", icon: CalendarDays },
  { href: "/hifz", key: "hifz", icon: PlayCircle },
  { href: "/quran", key: "quran", icon: BookOpenText },
  { href: "/dua", key: "dua", icon: MoonStar },
  { href: "/journal", key: "journal", icon: SquarePen, label: "Journal" },
];

const INSIGHTS: NavItem[] = [
  { href: "/quran/glossary", key: "glossary", icon: LibraryBig },
];

const PLATFORM: NavItem[] = [
  { href: "/roadmap", key: "roadmap", icon: Map },
  { href: "/support", key: "support", icon: LifeBuoy },
];

const MOBILE_NAV: NavItem[] = [
  { href: "/", key: "home", icon: House },
  { href: "/today", key: "today", icon: CalendarDays },
  { href: "/hifz", key: "hifz", icon: PlayCircle },
  { href: "/quran", key: "quran", icon: BookOpenText },
  { href: "/dua", key: "dua", icon: MoonStar },
  { href: "/journal", key: "journal", icon: SquarePen, label: "Journal" },
  { href: "/settings", key: "settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
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
  if (href === "/journal") {
    return pathname === "/journal" || pathname.startsWith("/journal/");
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
  if (href.startsWith("/quran")) {
    return pathname === "/quran" || pathname.startsWith("/quran/");
  }
  if (href === "/dua") {
    return pathname === "/dua" || pathname.startsWith("/dua/");
  }
  if (href === "/hifz") {
    return pathname === "/hifz" || pathname.startsWith("/hifz/") || pathname === "/session" || pathname.startsWith("/session/");
  }
  return pathname === href;
}

function NavLink(props: { item: NavItem; pathname: string; copy: ReturnType<typeof getAppUiCopy> }) {
  const { item, pathname, copy } = props;
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  const label = item.label ?? (item.key === "journal" ? "Journal" : copy.nav[item.key]);
  return (
    <TrackedLink
      key={item.href}
      href={item.href}
      telemetryName={`shell.nav.${item.key}`}
      className={clsx(
        "flex items-center gap-3 rounded-[18px] border px-3.5 py-2.5 text-sm font-semibold shadow-[var(--kw-shadow-soft)] transition",
        active
          ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[color:var(--kw-ink)]"
          : "border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] text-[color:var(--kw-muted)] hover:bg-[color:var(--kw-surface-strong)] hover:text-[color:var(--kw-ink)]",
      )}
    >
      <span
        className={clsx(
          "grid h-10 w-10 place-items-center rounded-[16px] border bg-[color:var(--kw-surface)] text-[color:var(--kw-ink-2)]",
          active ? "border-[rgba(var(--kw-accent-rgb),0.26)]" : "border-[color:var(--kw-border-2)]",
        )}
      >
        <Icon size={17} />
      </span>
      <span className="truncate">{label}</span>
    </TrackedLink>
  );
}

export function AppShell(props: { children: React.ReactNode; streakEnabled?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [platformOpen, setPlatformOpen] = useState(true);
  const { language } = useUiLanguage();
  const copy = getAppUiCopy(language);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const routes = Array.from(
      new Set([
        ...PRIMARY.map((item) => item.href),
        ...INSIGHTS.map((item) => item.href),
        ...PLATFORM.map((item) => item.href),
        "/settings",
      ]),
    ).filter((href) => href !== pathname);

    const prefetchRoutes = () => {
      routes.forEach((href) => router.prefetch(href));
    };

    const requestIdle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback.bind(window)
        : null;

    if (requestIdle) {
      const idleHandle = requestIdle(() => {
        prefetchRoutes();
      });
      return () => {
        window.cancelIdleCallback?.(idleHandle);
      };
    }

    const timeoutId = globalThis.setTimeout(prefetchRoutes, 120);
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [pathname, router]);

  return (
    <div className="min-h-dvh overflow-x-clip">
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
                <p className="text-xs text-[color:var(--kw-muted)]">{copy.brandTagline}</p>
              </div>
            </TrackedLink>

            <nav className="space-y-1">
              {PRIMARY.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} copy={copy} />
              ))}
            </nav>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setInsightsOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-[14px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--kw-faint)] transition hover:text-[color:var(--kw-muted)]"
              >
                <span>{copy.sectionInsights}</span>
                <ChevronDown
                  size={14}
                  className={clsx("transition-transform", insightsOpen && "rotate-180")}
                />
              </button>
              {insightsOpen ? (
                <div className="space-y-1">
                  {INSIGHTS.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} copy={copy} />
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
                <span>{copy.sectionProduct}</span>
                <ChevronDown
                  size={14}
                  className={clsx("transition-transform", platformOpen && "rotate-180")}
                />
              </button>
              {platformOpen ? (
                <div className="space-y-1">
                  {PLATFORM.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} copy={copy} />
                  ))}
                </div>
              ) : null}
            </div>

            <nav className="space-y-1">
              <NavLink
                item={{ href: "/settings", key: "settings", icon: Settings }}
                pathname={pathname}
                copy={copy}
              />
            </nav>

            <div className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] p-2">
              <UiLanguageSwitcher compact />
            </div>
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 pb-24 md:pb-0">
          {props.children}
        </main>
      </div>

      <nav className="fixed bottom-3 left-1/2 z-40 w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-[26px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)] px-2 py-2 shadow-[var(--kw-shadow)] backdrop-blur md:hidden">
        <div className="grid grid-cols-7 gap-1">
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const label = item.label ?? (item.key === "journal" ? "Journal" : copy.nav[item.key]);
            return (
              <TrackedLink
                key={item.href}
                href={item.href}
                telemetryName={`shell.mobile-nav.${item.key}`}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-semibold transition",
                  active
                    ? "bg-[rgba(var(--kw-accent-rgb),0.12)] text-[color:var(--kw-ink)]"
                    : "text-[color:var(--kw-muted)] hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]",
                )}
              >
                <Icon size={17} />
                <span className="truncate">{label}</span>
              </TrackedLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
