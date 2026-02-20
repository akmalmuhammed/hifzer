"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type StreakPayload = {
  ok: boolean;
  onboardingEligible: boolean;
  streak: {
    currentStreakDays: number;
    graceInUseToday: boolean;
  };
};

function badgeNumber(days: number): string {
  if (days > 99) {
    return "99+";
  }
  return String(Math.max(0, days));
}

export function StreakCornerBadge(props: { enabled: boolean }) {
  const pathname = usePathname();
  const [data, setData] = useState<StreakPayload | null>(null);

  useEffect(() => {
    if (!props.enabled) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/streak/summary", { cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const payload = (await res.json()) as StreakPayload;
        if (!cancelled) {
          setData(payload);
        }
      } catch {
        // Fail open: badge simply hides when streak summary is unavailable.
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [pathname, props.enabled]);

  const showThemeToggle = true;
  const showStreakBadge = props.enabled && Boolean(data?.onboardingEligible);

  if (!showStreakBadge && !showThemeToggle) {
    return null;
  }

  const days = Math.max(0, data?.streak.currentStreakDays ?? 0);
  const label = data?.streak.graceInUseToday
    ? `Current streak: ${days} days (grace in use today)`
    : `Current streak: ${days} days`;

  return (
    <div
      className="fixed z-50 flex items-center gap-2"
      style={{
        top: "calc(env(safe-area-inset-top) + 0.75rem)",
        right: "calc(env(safe-area-inset-right) + 0.75rem)",
      }}
    >
      {showThemeToggle ? (
        <span className="rounded-full border border-[color:var(--kw-border-2)] bg-white/85 p-1.5 text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] backdrop-blur">
          <ThemeToggle />
        </span>
      ) : null}

      {showStreakBadge ? (
        <TrackedLink
          href="/streak"
          telemetryName="shell.streak.badge"
          aria-label={label}
          title={label}
          className="rounded-full border border-[rgba(245,158,11,0.32)] bg-white/85 px-3 py-2 text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] backdrop-blur transition hover:bg-white"
        >
          <span className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[rgba(245,158,11,0.14)] text-[rgb(194,65,12)]">
              <Flame size={14} />
            </span>
            <span className="text-sm font-semibold leading-none">{badgeNumber(days)}</span>
            {data?.streak.graceInUseToday ? (
              <span className="rounded-full border border-[rgba(234,88,12,0.24)] bg-[rgba(234,88,12,0.10)] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--kw-ember-600)]">
                G
              </span>
            ) : null}
          </span>
        </TrackedLink>
      ) : null}
    </div>
  );
}
