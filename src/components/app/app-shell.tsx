"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import clsx from "clsx";
import {
  BookOpenText,
  CalendarDays,
  ChevronDown,
  HeartHandshake,
  LifeBuoy,
  LibraryBig,
  MessageSquareQuote,
  type LucideIcon,
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
import { isUiLanguageRtl, uiLanguageToHtmlLang } from "@/hifzer/i18n/ui-language";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { useUiLanguage } from "@/components/providers/ui-language-provider";
import styles from "./app-shell.module.css";

type NavKey =
  | "dashboard"
  | "hifz"
  | "quran"
  | "dua"
  | "worship"
  | "journal"
  | "glossary"
  | "assistant"
  | "roadmap"
  | "support"
  | "settings";

type NavItem = { href: string; key: NavKey; icon: LucideIcon; label?: string };

type AppNavCopyKey = Exclude<NavKey, "journal" | "assistant" | "worship">;

const PRIMARY: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: CalendarDays },
  { href: "/quran", key: "quran", icon: BookOpenText },
  { href: "/hifz", key: "hifz", icon: PlayCircle },
  { href: "/dua", key: "dua", icon: MoonStar },
  { href: "/worship", key: "worship", icon: HeartHandshake, label: "Trackers" },
  { href: "/journal", key: "journal", icon: SquarePen, label: "Journal" },
];

const INSIGHTS: NavItem[] = [
  { href: "/quran/glossary", key: "glossary", icon: LibraryBig },
  { href: "/assistant", key: "assistant", icon: MessageSquareQuote, label: "Ask Qur'an" },
];

const PLATFORM: NavItem[] = [
  { href: "/roadmap", key: "roadmap", icon: Map },
  { href: "/support", key: "support", icon: LifeBuoy },
];

const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: CalendarDays, label: "Today" },
  { href: "/quran", key: "quran", icon: BookOpenText },
  { href: "/hifz", key: "hifz", icon: PlayCircle },
  { href: "/dua", key: "dua", icon: MoonStar },
  { href: "/worship", key: "worship", icon: HeartHandshake, label: "Trackers" },
  { href: "/settings", key: "settings", icon: Settings, label: "More" },
];

const JOURNAL_RAIL_NAV: NavItem[] = [
  ...PRIMARY,
  { href: "/assistant", key: "assistant", icon: MessageSquareQuote, label: "Ask Qur'an" },
];

function getLikelyNextRoutes(pathname: string): string[] {
  if (pathname === "/dashboard") {
    return ["/quran", "/hifz"];
  }
  if (pathname === "/hifz" || pathname.startsWith("/hifz/") || pathname === "/session" || pathname.startsWith("/session/")) {
    return ["/dashboard", "/quran"];
  }
  if (pathname === "/quran" || pathname.startsWith("/quran/")) {
    return ["/dashboard", "/journal"];
  }
  if (pathname === "/journal" || pathname.startsWith("/journal/")) {
    return ["/dashboard", "/dua"];
  }
  if (pathname === "/dua" || pathname.startsWith("/dua/")) {
    return ["/dashboard", "/worship"];
  }
  if (pathname === "/worship" || pathname.startsWith("/worship/")) {
    return ["/dashboard", "/dua"];
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return ["/dashboard"];
  }
  return ["/dashboard", "/quran"];
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
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
  if (href === "/quran/glossary") {
    return pathname === "/quran/glossary";
  }
  if (href === "/assistant") {
    return pathname === "/assistant" || pathname.startsWith("/assistant/");
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

function getNavLabel(item: NavItem, copy: ReturnType<typeof getAppUiCopy>): string {
  if (item.label) {
    return item.label;
  }

  switch (item.key) {
    case "journal":
      return "Journal";
    case "assistant":
      return "Ask Qur'an";
    case "worship":
      return "Trackers";
    default:
      return copy.nav[item.key as AppNavCopyKey];
  }
}

function NavLink(props: {
  item: NavItem;
  pathname: string;
  copy: ReturnType<typeof getAppUiCopy>;
  compact?: boolean;
}) {
  const { item, pathname, copy, compact = false } = props;
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  const label = getNavLabel(item, copy);
  return (
    <TrackedLink
      key={item.href}
      href={item.href}
      telemetryName={`shell.nav.${item.key}`}
      aria-current={active ? "page" : undefined}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      data-active={active ? "true" : "false"}
      data-compact={compact ? "true" : "false"}
      className={clsx(
        styles.navLink,
        compact && styles.railNavLink,
        "flex items-center gap-2.5 rounded-[10px] font-medium transition-colors duration-150",
        active
          ? "bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-ink)]"
          : "text-[color:var(--kw-ink-2)] hover:bg-[color:var(--kw-hover-soft)] hover:text-[color:var(--kw-ink)]",
      )}
    >
      <span
        className={clsx(
          styles.navIcon,
          "grid shrink-0 place-items-center",
          active ? "text-[rgba(var(--kw-accent-rgb),1)]" : "text-[color:var(--kw-faint)]",
        )}
      >
        <Icon size={18} strokeWidth={1.9} />
      </span>
      <span className={clsx(styles.navText, compact && "sr-only", "truncate")}>{label}</span>
    </TrackedLink>
  );
}

export function AppShell(props: { children: React.ReactNode; streakEnabled?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [platformOpen, setPlatformOpen] = useState(true);
  const insightsId = useId();
  const platformId = useId();
  const { language } = useUiLanguage();
  const copy = getAppUiCopy(language);
  const quranShell = pathname === "/quran" || pathname.startsWith("/quran/");
  const journalShell = pathname === "/journal" || pathname.startsWith("/journal/");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") {
      return;
    }

    const routes = Array.from(new Set(getLikelyNextRoutes(pathname))).filter((href) => href !== pathname).slice(0, 2);
    if (routes.length < 1) {
      return;
    }

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    const updateDisplayTier = () => {
      const viewportWidth = Math.round(window.visualViewport?.width ?? window.innerWidth);
      const nextTier = viewportWidth >= 2400 ? "ultra" : viewportWidth >= 1800 ? "wide" : "base";
      root.dataset.displayTier = nextTier;
    };

    updateDisplayTier();
    window.addEventListener("resize", updateDisplayTier);
    window.visualViewport?.addEventListener("resize", updateDisplayTier);

    return () => {
      window.removeEventListener("resize", updateDisplayTier);
      window.visualViewport?.removeEventListener("resize", updateDisplayTier);
      delete root.dataset.displayTier;
    };
  }, []);

  return (
    <div
      className={clsx(
        "kw-app-shell min-h-dvh overflow-x-clip",
        quranShell && "kw-quran-shell",
        journalShell && styles.journalShell,
      )}
    >
      <div className={clsx(styles.frame, journalShell && styles.journalFrame)}>
        <aside
          lang={uiLanguageToHtmlLang(language)}
          dir={isUiLanguageRtl(language) ? "rtl" : "ltr"}
          className={clsx(
            styles.sidebar,
            journalShell && styles.journalSidebar,
            "hidden shrink-0 md:block",
          )}
        >
          <div
            className={clsx(
              styles.sidebarSticky,
              journalShell ? styles.journalSidebarSticky : "space-y-4",
            )}
          >
            <TrackedLink
              href="/"
              className={clsx(styles.brand, journalShell && styles.journalBrand, "flex items-center")}
              telemetryName="shell.logo"
            >
              <span className={clsx(styles.brandMark, "grid place-items-center")}>
                <HifzerMark />
              </span>
              <div className={clsx("leading-tight", journalShell && styles.journalBrandCopy)}>
                <p className="text-[1.06rem] font-semibold tracking-[-0.02em] text-[color:var(--kw-ink)]">Hifzer</p>
                {!journalShell ? <p className="text-xs text-[color:var(--kw-muted)]">{copy.brandTagline}</p> : null}
              </div>
            </TrackedLink>

            {journalShell ? (
              <div className={styles.journalRailBody}>
                <nav className={styles.journalRailNav} aria-label="Primary navigation">
                  {JOURNAL_RAIL_NAV.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} copy={copy} compact />
                  ))}
                </nav>
                <nav className={styles.journalRailFooter} aria-label="Settings">
                  <NavLink
                    item={{ href: "/settings", key: "settings", icon: Settings }}
                    pathname={pathname}
                    copy={copy}
                    compact
                  />
                </nav>
              </div>
            ) : (
              <>
                <nav className="space-y-1">
                  {PRIMARY.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} copy={copy} />
                  ))}
                </nav>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setInsightsOpen((v) => !v)}
                    aria-expanded={insightsOpen}
                    aria-controls={insightsId}
                    className={clsx(styles.sectionToggle, "flex w-full items-center justify-between rounded-[10px] px-2.5 py-1.5 font-semibold text-[color:var(--kw-faint)] transition-colors hover:text-[color:var(--kw-ink-2)]")}
                  >
                    <span>{copy.sectionInsights}</span>
                    <ChevronDown
                      size={14}
                      className={clsx("transition-transform", insightsOpen && "rotate-180")}
                    />
                  </button>
                  {insightsOpen ? (
                    <div id={insightsId} className="space-y-1">
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
                    aria-expanded={platformOpen}
                    aria-controls={platformId}
                    className={clsx(styles.sectionToggle, "flex w-full items-center justify-between rounded-[10px] px-2.5 py-1.5 font-semibold text-[color:var(--kw-faint)] transition-colors hover:text-[color:var(--kw-ink-2)]")}
                  >
                    <span>{copy.sectionProduct}</span>
                    <ChevronDown
                      size={14}
                      className={clsx("transition-transform", platformOpen && "rotate-180")}
                    />
                  </button>
                  {platformOpen ? (
                    <div id={platformId} className="space-y-1">
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

                <div className={clsx(styles.languageCard, "rounded-[12px]")}>
                  <UiLanguageSwitcher compact />
                </div>
              </>
            )}
          </div>
        </aside>

        <main id="main-content" tabIndex={-1} className={clsx(styles.main, journalShell && styles.journalMain)}>
          {!journalShell ? <StreakCornerBadge enabled={Boolean(props.streakEnabled)} /> : null}
          <div className={clsx(styles.mainInner, journalShell && styles.journalMainInner)}>
            {props.children}
          </div>
        </main>
      </div>

      <nav
        aria-label="Primary navigation"
        lang={uiLanguageToHtmlLang(language)}
        dir={isUiLanguageRtl(language) ? "rtl" : "ltr"}
        className={clsx(styles.mobileNav, "fixed left-1/2 z-40 w-[min(520px,calc(100vw-1.5rem))] -translate-x-1/2 kw-material rounded-[28px] border border-[color:var(--kw-border-2)] px-1.5 py-1.5 shadow-[var(--kw-shadow-float)] md:hidden")}
      >
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${MOBILE_NAV.length}, minmax(0, 1fr))` }}
        >
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const label = getNavLabel(item, copy);
            return (
              <TrackedLink
                key={item.href}
                href={item.href}
                telemetryName={`shell.mobile-nav.${item.key}`}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex flex-col items-center justify-center gap-0.5 rounded-[22px] px-1 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-ink)] [&_svg]:text-[rgba(var(--kw-accent-rgb),1)]"
                    : "text-[color:var(--kw-muted)] hover:text-[color:var(--kw-ink)]",
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
