"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Eraser, LogOut, Settings } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardSoft, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { useDemoAuth } from "@/demo/demo-auth";
import { useDemoStore } from "@/demo/store";
import { useTeam } from "@/demo/team";
import { KW_EASE_OUT } from "@/lib/motion";

export default function SettingsPage() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const { user, signOut } = useDemoAuth();
  const { activeTeam } = useTeam();
  const store = useDemoStore();
  const { pushToast } = useToast();

  const prefs = store.preferences;
  const densityLabel = useMemo(() => (prefs.density === "compact" ? "Compact" : "Cozy"), [prefs.density]);

  const reveal = (delay: number) => ({
    initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.45, ease: KW_EASE_OUT, delay },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={activeTeam.name}
        title="Settings"
        subtitle="Demo-only preferences, stored locally. Reset anytime."
        right={
          <Link href="/legacy/app">
            <Button variant="secondary" className="gap-2">
              Dashboard <ArrowRight size={16} />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div {...reveal(0.02)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Profile</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Demo identity for local prototype auth.
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                <Settings size={18} />
              </span>
            </div>

            <div className="mt-4 rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={user?.name ?? "Demo user"} seed={user?.id ?? "anon"} size={44} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[color:var(--kw-ink)]">
                      {user?.name ?? "Signed out"}
                    </p>
                    <p className="truncate text-xs text-[color:var(--kw-muted)]">{user?.email ?? "Pick a demo user."}</p>
                    <p className="mt-1 text-xs text-[color:var(--kw-faint)]">Team: {activeTeam.name}</p>
                  </div>
                </div>
                {user ? <Pill tone="neutral">{user.id}</Pill> : null}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <CardSoft className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Auth
                </p>
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">localStorage</p>
                <p className="mt-1 text-xs text-[color:var(--kw-faint)]">kw_demo_user_v1</p>
              </CardSoft>
              <CardSoft className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Active team
                </p>
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">localStorage</p>
                <p className="mt-1 text-xs text-[color:var(--kw-faint)]">kw_demo_team_v1</p>
              </CardSoft>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => {
                  signOut();
                  pushToast({ title: "Signed out", message: "Demo auth cleared.", tone: "neutral" });
                  router.replace("/");
                }}
              >
                <LogOut size={16} /> Sign out
              </Button>

              <Link href="/legacy/sign-in">
                <Button className="gap-2">
                  Switch identity <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        <motion.div {...reveal(0.06)} className="min-w-0">
          <Card className="overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Preferences</CardTitle>
                <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                  Tweak the cockpit feel. Persisted locally.
                </p>
              </div>
              <Pill tone="neutral">{densityLabel}</Pill>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                  Density
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["cozy", "compact"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => store.setPreferences({ density: d })}
                      className={
                        d === prefs.density
                          ? "rounded-full border border-[rgba(43,75,255,0.25)] bg-[rgba(43,75,255,0.12)] px-3 py-2 text-xs font-semibold text-[rgba(31,54,217,1)]"
                          : "rounded-full border border-[color:var(--kw-border-2)] bg-white/65 px-3 py-2 text-xs font-semibold text-[color:var(--kw-muted)] hover:bg-white"
                      }
                    >
                      {d === "cozy" ? "Cozy" : "Compact"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Weekly digest</p>
                      <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                        Show a weekly snapshot prompt.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.weeklyDigest}
                      onChange={(e) => store.setPreferences({ weeklyDigest: e.target.checked })}
                      className="mt-1 h-5 w-5 accent-[rgba(31,54,217,1)]"
                      aria-label="Weekly digest"
                    />
                  </div>
                </label>

                <label className="rounded-[22px] border border-[color:var(--kw-border-2)] bg-white/70 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Weekend activity</p>
                      <p className="mt-1 text-xs text-[color:var(--kw-muted)]">
                        Include weekends in heat strips.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.showWeekendActivity}
                      onChange={(e) => store.setPreferences({ showWeekendActivity: e.target.checked })}
                      className="mt-1 h-5 w-5 accent-[rgba(31,54,217,1)]"
                      aria-label="Weekend activity"
                    />
                  </div>
                </label>
              </div>

              <div className="rounded-[22px] border border-[rgba(234,88,12,0.28)] bg-[rgba(234,88,12,0.10)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-ember-600)]">
                  Reset
                </p>
                <p className="mt-2 text-sm text-[color:var(--kw-muted)]">
                  Clears stored check-ins and preferences for this demo.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => {
                      store.resetDemo();
                      pushToast({ title: "Demo reset", message: "Local store cleared.", tone: "warning" });
                      router.refresh();
                    }}
                  >
                    <Eraser size={16} /> Reset demo store
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
