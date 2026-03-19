"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { usePaddle } from "@/components/billing/paddle-provider";

const PRESET_AMOUNTS = [49, 99, 249, 499];

type CheckoutPayload = {
  transactionId: string;
  successUrl?: string;
};

function normalizeAmount(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "";
  }
  return parsed.toFixed(2);
}

export function SupportCheckoutCard(props: { className?: string; hasPortal?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("10.00");
  const { configured, ready, openCheckout } = usePaddle();
  const { pushToast } = useToast();

  const normalizedAmount = useMemo(() => normalizeAmount(amount), [amount]);

  return (
    <div className={props.className}>
      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((value) => {
          const formatted = value.toFixed(2);
          const active = normalizedAmount === formatted;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setAmount(formatted)}
              className={clsx(
                "inline-flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition",
                active
                  ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                  : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] hover:bg-white",
              )}
            >
              ${value}
            </button>
          );
        })}
      </div>

      <label className="mt-4 block text-sm font-semibold text-[color:var(--kw-ink)]" htmlFor="support-amount">
        Custom amount
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="flex h-11 min-w-[180px] items-center rounded-xl border border-[color:var(--kw-border-2)] bg-white/75 px-3 text-sm text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)]">
          <span className="mr-2 text-[color:var(--kw-muted)]">$</span>
          <input
            id="support-amount"
            inputMode="decimal"
            min="1"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-[color:var(--kw-faint)]"
            placeholder="10.00"
            aria-describedby="support-amount-help"
          />
        </div>

        <Button
          loading={loading}
          disabled={!configured || !ready || !normalizedAmount}
          className="gap-2"
          onClick={async () => {
            if (!configured || !ready) {
              pushToast({
                tone: "warning",
                title: "Paddle is not ready",
                message: "Set Paddle environment values and reload this page.",
              });
              return;
            }
            if (!normalizedAmount) {
              pushToast({
                tone: "warning",
                title: "Enter an amount",
                message: "Use any amount from $1.00 upward.",
              });
              return;
            }

            setLoading(true);
            try {
              const res = await fetch("/api/paddle/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: normalizedAmount }),
              });
              const payload = (await res.json()) as CheckoutPayload & { error?: string };
              if (!res.ok) {
                throw new Error(payload.error || "Failed to create checkout.");
              }

              openCheckout({
                transactionId: payload.transactionId,
                successUrl: payload.successUrl,
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unknown checkout error.";
              pushToast({
                tone: "warning",
                title: "Checkout failed",
                message,
              });
            } finally {
              setLoading(false);
            }
          }}
        >
          Purchase for ${normalizedAmount || "0.00"} <ArrowUpRight size={16} />
        </Button>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.08)] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.22)] bg-white/60 text-[rgba(var(--kw-accent-rgb),1)]">
            <BriefcaseBusiness size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">One-time product work</p>
            <p id="support-amount-help" className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">
              Use this checkout for software-related Hifzer work like custom development, feature implementation,
              private workflow help, or paid product requests. Paddle sends the receipt and buyer support details after checkout.
            </p>
            {props.hasPortal ? (
              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                Your Paddle customer record is already linked, so receipts and payment history can appear in the buyer portal.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
