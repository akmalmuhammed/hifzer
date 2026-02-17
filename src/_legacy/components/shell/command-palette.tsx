"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ArrowRight,
  ChevronRight,
  Command as CommandIcon,
  FolderKanban,
  Target,
  LayoutDashboard,
  Search,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { useDemoAuth } from "@/demo/demo-auth";
import { useDemoStore } from "@/demo/store";
import { useTeam } from "@/demo/team";
import { useToast } from "@/components/ui/toast";

export function openCommandPalette(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event("kw:open-command-palette"));
}

type CommandItem = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  action: () => void;
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function scoreMatch(query: string, haystack: string): number {
  // Tiny fuzzy-ish scorer: contiguous matches score higher; subsequence matches still count.
  const q = normalize(query);
  const h = normalize(haystack);
  if (!q) {
    return 1;
  }
  if (h.includes(q)) {
    return 100 - h.indexOf(q);
  }
  let qi = 0;
  let run = 0;
  let score = 0;
  for (let i = 0; i < h.length && qi < q.length; i += 1) {
    if (h[i] === q[qi]) {
      qi += 1;
      run += 1;
      score += 3 + run;
    } else {
      run = 0;
      score -= 0.2;
    }
  }
  return qi === q.length ? score : 0;
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status } = useDemoAuth();
  const { teams, activeTeam, setActiveTeamId } = useTeam();
  const store = useDemoStore();
  const { pushToast } = useToast();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    function onHotkey(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "k") {
        event.preventDefault();
        openPalette();
      }
      if (event.key === "Escape") {
        closePalette();
      }
    }

    function onOpenEvent() {
      openPalette();
    }

    window.addEventListener("keydown", onHotkey);
    window.addEventListener("kw:open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onHotkey);
      window.removeEventListener("kw:open-command-palette", onOpenEvent);
    };
  }, [closePalette, openPalette]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const commands = useMemo<CommandItem[]>(() => {
    const nav: CommandItem[] = [
      {
        id: "nav_dashboard",
        group: "Navigate",
        label: "Dashboard",
        hint: "/legacy/app",
        icon: <LayoutDashboard size={16} />,
        right: (
          <span className="flex items-center gap-1 text-xs text-[color:var(--kw-faint)]">
            <CommandIcon size={14} />
            K
          </span>
        ),
        action: () => router.push("/legacy/app"),
        keywords: "home overview",
      },
      {
        id: "nav_goals",
        group: "Navigate",
        label: "Goals (OKRs)",
        hint: "/legacy/app/goals",
        icon: <Target size={16} />,
        action: () => router.push("/legacy/app/goals"),
        keywords: "okr objectives key results",
      },
      {
        id: "nav_projects",
        group: "Navigate",
        label: "Projects",
        hint: "/legacy/app/projects",
        icon: <FolderKanban size={16} />,
        action: () => router.push("/legacy/app/projects"),
        keywords: "milestones timeline roadmap",
      },
      {
        id: "nav_insights",
        group: "Navigate",
        label: "Insights",
        hint: "/legacy/app/insights",
        icon: <Zap size={16} />,
        action: () => router.push("/legacy/app/insights"),
        keywords: "risks blockers wins trends",
      },
      {
        id: "nav_team",
        group: "Navigate",
        label: "Team",
        hint: "/legacy/app/team",
        icon: <Users size={16} />,
        action: () => router.push("/legacy/app/team"),
        keywords: "members workload rituals",
      },
      {
        id: "nav_settings",
        group: "Navigate",
        label: "Settings",
        hint: "/legacy/app/settings",
        icon: <Settings size={16} />,
        action: () => router.push("/legacy/app/settings"),
        keywords: "preferences profile",
      },
    ];

    if (status !== "signed_in" || !user) {
      return [
        ...nav.map((c) => ({
          ...c,
          action: () => {
            router.push(`/legacy/sign-in?next=${encodeURIComponent(c.hint ?? "/legacy/app")}`);
            closePalette();
          },
        })),
      ];
    }

    const teamCommands: CommandItem[] = teams.map((t) => ({
      id: `team_${t.id}`,
      group: "Switch team",
      label: t.name,
      hint: t.tagline,
      icon: (
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: t.brand.primary }}
        />
      ),
      right: t.id === activeTeam.id ? (
        <span className="text-xs font-semibold text-[color:var(--kw-muted)]">Active</span>
      ) : (
        <ChevronRight size={16} className="text-[color:var(--kw-faint)]" />
      ),
      keywords: `${t.handle} ${t.tagline}`,
      action: () => {
        setActiveTeamId(t.id);
        pushToast({ title: "Team switched", message: t.name, tone: "success" });
        closePalette();
      },
    }));

    const okrCommands: CommandItem[] = store
      .listOkrsForTeam(activeTeam.id)
      .slice(0, 10)
      .map((o) => ({
        id: `okr_${o.id}`,
        group: "Jump to OKR",
        label: o.objective,
        hint: o.timeframe,
        icon: <Target size={16} />,
      keywords: `${o.tags.join(" ")} ${o.timeframe}`,
      action: () => {
        router.push(`/legacy/app/goals/${o.id}`);
        closePalette();
      },
      right: <ArrowRight size={16} className="text-[color:var(--kw-faint)]" />,
    }));

    const projectCommands: CommandItem[] = store
      .listProjectsForTeam(activeTeam.id)
      .slice(0, 10)
      .map((p) => ({
        id: `proj_${p.id}`,
        group: "Jump to Project",
        label: p.name,
        hint: `${p.status} · ${p.health}`,
        icon: <FolderKanban size={16} />,
      keywords: `${p.tags.join(" ")} ${p.status} ${p.health}`,
      action: () => {
        router.push(`/legacy/app/projects/${p.id}`);
        closePalette();
      },
      right: <ArrowRight size={16} className="text-[color:var(--kw-faint)]" />,
    }));

    return [...nav, ...teamCommands, ...okrCommands, ...projectCommands];
  }, [activeTeam.id, closePalette, pushToast, router, setActiveTeamId, status, store, teams, user]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) {
      return commands;
    }
    return commands
      .map((c) => {
        const s = Math.max(
          scoreMatch(q, c.label),
          scoreMatch(q, c.hint ?? ""),
          scoreMatch(q, c.keywords ?? ""),
          scoreMatch(q, c.group),
        );
        return { cmd: c, score: s };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.cmd);
  }, [commands, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      if (!map.has(item.group)) {
        map.set(item.group, []);
      }
      map.get(item.group)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (!open) {
    return null;
  }

  const flat = filtered;
  const active = flat[Math.max(0, Math.min(activeIndex, flat.length - 1))];

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-start bg-black/[0.26] p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closePalette();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="w-full max-w-2xl rounded-[26px] border border-[color:var(--kw-border-2)] bg-white/80 shadow-[var(--kw-shadow)] backdrop-blur">
        <div className="flex items-center gap-3 border-b border-[color:var(--kw-border-2)] px-4 py-3">
          <Search size={16} className="text-[color:var(--kw-faint)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                closePalette();
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
                return;
              }
              if (e.key === "Enter" && active) {
                e.preventDefault();
                active.action();
                return;
              }
            }}
            placeholder="Search commands, teams, OKRs, projects..."
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-[color:var(--kw-faint)]"
          />
          <span className="hidden items-center gap-1 rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-1 text-xs text-[color:var(--kw-muted)] sm:inline-flex">
            Esc
          </span>
        </div>

        <div className="max-h-[52vh] overflow-auto px-2 py-2">
          {flat.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-[color:var(--kw-muted)]">
              No results. Try a different query.
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(([group, items]) => (
                <div key={group}>
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const index = flat.findIndex((c) => c.id === item.id);
                      const isActive = index === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => item.action()}
                          className={clsx(
                            "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left transition",
                            isActive ? "bg-black/[0.06]" : "hover:bg-black/[0.04]",
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="grid h-8 w-8 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                              {item.icon ?? <ArrowRight size={16} />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                                {item.label}
                              </span>
                              {item.hint ? (
                                <span className="block truncate text-xs text-[color:var(--kw-muted)]">
                                  {item.hint}
                                </span>
                              ) : null}
                            </span>
                          </span>
                          {item.right ? (
                            <span className="shrink-0">{item.right}</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[color:var(--kw-border-2)] px-4 py-3 text-xs text-[color:var(--kw-muted)]">
            <span className="truncate">
            {pathname?.startsWith("/legacy/app") ? `Team: ${activeTeam.name}` : "Kitewave"}
          </span>
          <span className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-1">↑</span>
            <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-1">↓</span>
            <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/70 px-2 py-1">Enter</span>
          </span>
        </div>
      </div>
    </div>
  );
}
