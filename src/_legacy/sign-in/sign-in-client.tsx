"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { DEMO } from "@/demo/data";
import { useDemoAuth } from "@/demo/demo-auth";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/g);
  const first = parts[0]?.[0] ?? "K";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

export function SignInClient(props: { nextPath: string }) {
  const router = useRouter();
  const { signInAs, user } = useDemoAuth();
  const { pushToast } = useToast();

  const users = useMemo(() => DEMO.users.slice(), []);

  return (
    <div className="pb-16 pt-10 md:pb-20 md:pt-14">
      <div className="mx-auto max-w-3xl">
        <Pill tone="neutral">Demo auth</Pill>
        <h1 className="mt-4 text-balance font-[family-name:var(--font-kw-display)] text-5xl leading-[0.95] tracking-tight text-[color:var(--kw-ink)] sm:text-6xl">
          Sign in instantly.
          <span className="block text-[rgba(31,54,217,1)]">No keys. No setup.</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">
          Pick a demo identity and jump into the cockpit. Your choices persist locally in this
          browser.
        </p>

        {user ? (
          <div className="mt-6 rounded-[22px] border border-[rgba(10,138,119,0.25)] bg-[rgba(10,138,119,0.10)] px-4 py-3 text-sm text-[color:var(--kw-teal-800)]">
            You are currently signed in as <span className="font-semibold">{user.name}</span>.
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {users.map((u) => (
            <Card key={u.id} className="relative overflow-hidden">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-60 blur-2xl"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(43,75,255,0.25), transparent 68%)",
                }}
              />
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]">
                  <span className="font-[family-name:var(--font-kw-display)] text-lg tracking-tight">
                    {initials(u.name)}
                  </span>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)]">
                  <ShieldCheck size={18} />
                </span>
              </div>

              <p className="mt-4 text-sm font-semibold text-[color:var(--kw-ink)]">{u.name}</p>
              <p className="mt-1 text-xs text-[color:var(--kw-muted)]">{u.email}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
                Teams
              </p>
              <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
                {u.teamIds.length} workspaces
              </p>

              <div className="mt-6">
                <Button
                  className={clsx("w-full")}
                  onClick={() => {
                    signInAs(u.id);
                    pushToast({ title: "Signed in", message: u.name, tone: "success" });
                    router.replace(props.nextPath);
                  }}
                >
                  Continue <ArrowRight size={18} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

