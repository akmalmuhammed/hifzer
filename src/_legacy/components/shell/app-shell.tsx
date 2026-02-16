"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Bell,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { KitewaveMark } from "@/components/brand/kitewave-mark";
import { openCommandPalette } from "@/components/shell/command-palette";
import { TeamSwitcher } from "@/components/shell/team-switcher";
import { Button } from "@/components/ui/button";
import { useDemoAuth } from "@/demo/demo-auth";
import { useToast } from "@/components/ui/toast";

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/goals", label: "Goals", icon: Target },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
  { href: "/app/insights", label: "Insights", icon: Zap },
  { href: "/app/team", label: "Team", icon: Users },
  { href: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useDemoAuth();
  const { pushToast } = useToast();

  return (
    <div className="min-h-dvh">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[260px_1fr] md:gap-6 md:px-6">
        <NavRail pathname={pathname ?? "/"} />

        <div className="min-w-0">
          <TopBar
            onOpenSearch={() => openCommandPalette()}
            onSignOut={() => {
              signOut();
              pushToast({ title: "Signed out", message: "See you soon.", tone: "neutral" });
              router.replace("/");
            }}
            userLabel={user ? user.name : "Demo user"}
          />

          <main className="min-w-0 pb-28 pt-4 md:pb-8">
            <div className="rounded-[28px] border border-[color:var(--kw-border-2)] bg-white/40 p-3 shadow-[var(--kw-shadow-soft)] backdrop-blur md:p-5">
              {children}
            </div>
          </main>
        </div>
      </div>

      <MobileNav pathname={pathname ?? "/"} />
    </div>
  );
}

function NavRail({ pathname }: { pathname: string }) {
  return (
    <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] min-w-0 md:block">
      <div className="flex h-full flex-col gap-4 rounded-[28px] border border-[color:var(--kw-border-2)] bg-white/55 p-4 shadow-[var(--kw-shadow-soft)] backdrop-blur">
        <Link href="/" className="group flex items-center gap-3 rounded-2xl px-2 py-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[color:var(--kw-ink)] text-white shadow-[var(--kw-shadow-soft)]">
            <KitewaveMark className="opacity-95" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-[color:var(--kw-ink)]">
              Kitewave
            </span>
            <span className="block truncate text-xs text-[color:var(--kw-muted)]">
              Team OKR cockpit
            </span>
          </span>
        </Link>

        <nav className="space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2 transition",
                  active ? "bg-black/[0.06]" : "hover:bg-black/[0.04]",
                )}
              >
                <span
                  className={clsx(
                    "grid h-9 w-9 place-items-center rounded-2xl border",
                    active
                      ? "border-[rgba(43,75,255,0.28)] bg-[rgba(43,75,255,0.12)] text-[rgba(31,54,217,1)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]",
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[color:var(--kw-ink)]">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-[color:var(--kw-muted)]">
                    {active ? "You are here" : "Jump in"}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Shortcut
          </p>
          <button
            type="button"
            onClick={() => openCommandPalette()}
            className="mt-2 flex w-full items-center justify-between rounded-2xl border border-[color:var(--kw-border-2)] bg-white/80 px-3 py-2 text-left text-sm font-semibold text-[color:var(--kw-ink)] transition hover:bg-white"
          >
            <span>Search everything</span>
            <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-1 text-xs text-[color:var(--kw-muted)]">
              Ctrl K
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function TopBar(props: { userLabel: string; onOpenSearch: () => void; onSignOut: () => void }) {
  return (
    <header className="kw-glass-strong relative z-40 rounded-[28px] px-3 py-3 md:px-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TeamSwitcher />
          <button
            type="button"
            onClick={props.onOpenSearch}
            className={clsx(
              "hidden items-center gap-2 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] backdrop-blur transition hover:bg-white sm:inline-flex",
            )}
          >
            <span className="text-[color:var(--kw-faint)]">Search</span>
            <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-1 text-xs text-[color:var(--kw-muted)]">
              Ctrl K
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => props.onOpenSearch()}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)] backdrop-blur transition hover:bg-white sm:hidden"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)] backdrop-blur transition hover:bg-white"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          <div className="hidden rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] backdrop-blur md:block">
            {props.userLabel}
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="gap-2 shadow-[var(--kw-shadow-soft)]"
            onClick={props.onSignOut}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--kw-border-2)] bg-white/78 px-4 py-2 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-[520px] items-center justify-between">
        {NAV.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition",
                active ? "text-[rgba(31,54,217,1)]" : "text-[color:var(--kw-muted)]",
              )}
            >
              <Icon size={18} />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
