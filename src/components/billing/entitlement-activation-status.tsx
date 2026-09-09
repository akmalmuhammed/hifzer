"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackProductEvent } from "@/lib/telemetry/client";

type State = "checking" | "active" | "delayed" | "error";

export function EntitlementActivationStatus() {
  const [state, setState] = useState<State>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let checks = 0;

    async function check() {
      checks += 1;
      try {
        const response = await fetch("/api/billing/entitlement", { cache: "no-store" });
        if (!response.ok) throw new Error("status_unavailable");
        const payload = (await response.json()) as { active?: boolean; lifetime?: boolean };
        if (cancelled) return;
        if (payload.active) {
          setState("active");
          trackProductEvent("checkout.activated", { outcome: payload.lifetime ? "lifetime" : "active" });
          return;
        }
        if (checks >= 12) {
          setState("delayed");
          trackProductEvent("checkout.activation", { outcome: "delayed" });
          return;
        }
        timer = window.setTimeout(check, 2500);
      } catch {
        if (!cancelled) setState("error");
      }
    }

    setState("checking");
    void check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [attempt]);

  return (
    <div className="mt-4 rounded-2xl border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] p-4" aria-live="polite">
      {state === "active" ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={17} aria-hidden="true" /> Premium is active on your account.
        </p>
      ) : state === "checking" ? (
        <p className="flex items-center gap-2 text-sm text-[color:var(--kw-muted)]">
          <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> Activating premium securely…
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[color:var(--kw-muted)]">
            {state === "delayed"
              ? "Payment is complete, but account activation is taking longer than usual. Your receipt is unaffected."
              : "We could not check account activation right now."}
          </p>
          <Button variant="secondary" className="min-h-11 gap-2" onClick={() => setAttempt((value) => value + 1)}>
            Check again <RefreshCw size={16} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
