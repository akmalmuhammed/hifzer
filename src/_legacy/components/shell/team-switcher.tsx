"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { useTeam } from "@/demo/team";
import { useToast } from "@/components/ui/toast";

export function TeamSwitcher({ className }: { className?: string }) {
  const { teams, activeTeam, setActiveTeamId } = useTeam();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (!open) {
        return;
      }
      const el = rootRef.current;
      if (!el) {
        return;
      }
      if (event.target instanceof Node && el.contains(event.target)) {
        return;
      }
      setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-2 rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2",
          "shadow-[var(--kw-shadow-soft)] backdrop-blur transition hover:bg-white",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: activeTeam.brand.primary }}
        />
        <span className="min-w-0 text-left">
          <span className="block max-w-[180px] truncate text-sm font-semibold text-[color:var(--kw-ink)]">
            {activeTeam.name}
          </span>
          <span className="block max-w-[180px] truncate text-xs text-[color:var(--kw-muted)]">
            {activeTeam.tagline}
          </span>
        </span>
        <ChevronDown size={16} className="text-[color:var(--kw-faint)]" />
      </button>

      {open ? (
        <div
          role="menu"
          className={clsx(
            "absolute left-0 top-[calc(100%+10px)] z-40 w-[min(340px,calc(100vw-2rem))]",
            "rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/85 p-2 shadow-[var(--kw-shadow)] backdrop-blur",
          )}
        >
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Teams
          </p>
          <div className="space-y-1 pb-1">
            {teams.map((team) => {
              const active = team.id === activeTeam.id;
              return (
                <button
                  key={team.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveTeamId(team.id);
                    pushToast({ title: "Team switched", message: team.name, tone: "success" });
                    setOpen(false);
                  }}
                  className={clsx(
                    "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left transition",
                    active ? "bg-black/[0.06]" : "hover:bg-black/[0.04]",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-9 w-9 rounded-2xl border border-[color:var(--kw-border-2)]"
                      style={{
                        background: `radial-gradient(12px 12px at 30% 30%, rgba(255,255,255,0.9), rgba(255,255,255,0.0)), linear-gradient(135deg, ${team.brand.primary}, ${team.brand.accent})`,
                      }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                        {team.name}
                      </span>
                      <span className="block truncate text-xs text-[color:var(--kw-muted)]">
                        @{team.handle} · {team.tagline}
                      </span>
                    </span>
                  </span>
                  {active ? (
                    <span className="grid h-7 w-7 place-items-center rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                      <Check size={16} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

