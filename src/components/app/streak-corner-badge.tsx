"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { TrackedLink } from "@/components/telemetry/tracked-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { readSessionCache, writeSessionCache } from "@/lib/client-session-cache";
import styles from "./app-shell.module.css";

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

const STREAK_BADGE_CACHE_KEY = "hifzer.streak.badge.v1";
const STREAK_BADGE_CACHE_TTL_MS = 5 * 60 * 1000;

export function StreakCornerBadge(props: { enabled: boolean }) {
  const [data, setData] = useState<StreakPayload | null>(null);

  useEffect(() => {
    if (!props.enabled) {
      return;
    }

    let cancelled = false;
    let cacheTimer: number | null = null;

    const cached = readSessionCache<StreakPayload>(STREAK_BADGE_CACHE_KEY, STREAK_BADGE_CACHE_TTL_MS);
    if (cached) {
      cacheTimer = window.setTimeout(() => {
        if (!cancelled) {
          setData(cached);
        }
      }, 0);
    }

    const load = async () => {
      try {
        const res = await fetch("/api/streak/summary", { cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const payload = (await res.json()) as StreakPayload;
        if (!cancelled) {
          setData(payload);
          writeSessionCache(STREAK_BADGE_CACHE_KEY, payload);
        }
      } catch {
        // Fail open: badge simply hides when streak summary is unavailable.
      }
    };

    void load();

    const mobileViewport = window.matchMedia("(max-width: 767px)").matches;
    if (!mobileViewport) {
      return () => {
        cancelled = true;
        if (cacheTimer != null) {
          window.clearTimeout(cacheTimer);
        }
      };
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(onVisible, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      if (cacheTimer != null) {
        window.clearTimeout(cacheTimer);
      }
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [props.enabled]);

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
    <div className={styles.topUtilityRow}>
      <InstallAppButton className="max-w-full md:hidden" />

      {showThemeToggle || showStreakBadge ? (
        <div className="flex min-h-12 max-w-full items-center overflow-hidden rounded-full border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface)]/96 px-1.25 py-1.25 text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] backdrop-blur">
          {showThemeToggle ? (
            <ThemeToggle className="h-10 w-10 rounded-full border-0 bg-transparent shadow-none hover:bg-[color:var(--kw-hover-soft)]" />
          ) : null}

          {showThemeToggle && showStreakBadge ? (
            <span
              aria-hidden="true"
              className="mx-1.25 h-7 w-px rounded-full bg-[color:var(--kw-border-2)]"
            />
          ) : null}

          {showStreakBadge ? (
            <TrackedLink
              href="/dashboard"
              telemetryName="shell.streak.badge"
              aria-label={label}
              title={label}
              className="max-w-full rounded-full px-3 py-2 text-[color:var(--kw-ink)] transition hover:bg-[color:var(--kw-hover-soft)]"
            >
              <span className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[rgba(245,158,11,0.14)] text-[rgb(194,65,12)]">
                  <Flame size={14} />
                </span>
                <span className="text-[0.95rem] font-semibold leading-none">{badgeNumber(days)}</span>
                {data?.streak.graceInUseToday ? (
                  <span className="rounded-full border border-[rgba(234,88,12,0.24)] bg-[rgba(234,88,12,0.10)] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--kw-ember-600)]">
                    G
                  </span>
                ) : null}
              </span>
            </TrackedLink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
