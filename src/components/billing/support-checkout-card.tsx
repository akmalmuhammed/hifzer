"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowUpRight, Check, LifeBuoy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { usePaddle } from "@/components/billing/paddle-provider";

const PRESET_OPTIONS = [
  {
    amount: 49,
    label: "Account help",
    detail: "One focused Hifzer account, billing, or setup question with written follow-up.",
  },
  {
    amount: 99,
    label: "Priority assistance",
    detail: "One Hifzer product issue or workflow question with priority written follow-up.",
    recommended: true,
  },
  {
    amount: 249,
    label: "Product review",
    detail: "A deeper review of one Hifzer area, such as setup, sync, bookmarks, or dashboard flow.",
  },
  {
    amount: 499,
    label: "Extended review",
    detail: "A larger async review across multiple Hifzer flows or launch-readiness questions.",
  },
] as const;

type PresetOption = {
  amount: number;
  label: string;
  detail: string;
  recommended?: boolean;
};

const PRESETS: readonly PresetOption[] = PRESET_OPTIONS;

const TRUST_POINTS = [
  "One-time payment",
  "No subscription",
  "Paddle receipt included",
] as const;

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
  const [amount, setAmount] = useState("99.00");
  const { configured, ready, openCheckout } = usePaddle();
  const { pushToast } = useToast();

  const normalizedAmount = useMemo(() => normalizeAmount(amount), [amount]);
  const selectedPreset = useMemo(
    () => PRESETS.find((option) => normalizedAmount === option.amount.toFixed(2)) ?? null,
    [normalizedAmount],
  );
  const amountError =
    amount.trim().length > 0 && !normalizedAmount ? "Enter a valid amount from $1.00 upward." : "";
  const amountDescribedBy = amountError
    ? "support-amount-help support-amount-error"
    : "support-amount-help";

  return (
    <div className={props.className}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--kw-faint)]">
          Choose a starting amount
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PRESETS.map((option) => {
            const formatted = option.amount.toFixed(2);
            const active = normalizedAmount === formatted;
            return (
              <button
                key={option.amount}
                type="button"
                onClick={() => setAmount(formatted)}
                className={clsx(
                  "group rounded-[18px] border px-3 py-3 text-left transition",
                  active
                    ? "border-[rgba(var(--kw-accent-rgb),0.32)] bg-[rgba(var(--kw-accent-rgb),0.12)] shadow-[var(--kw-shadow-soft)]"
                    : "border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-strong)] hover:border-[rgba(var(--kw-accent-rgb),0.18)] hover:bg-[color:var(--kw-card-strong)]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold tracking-tight text-[color:var(--kw-ink)]">
                      {option.label}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--kw-muted)]">${option.amount}</p>
                  </div>
                  {option.recommended ? <Pill tone="accent">Recommended</Pill> : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--kw-muted)]">{option.detail}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TRUST_POINTS.map((point) => (
          <span
            key={point}
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--kw-ink-2)]"
          >
            <Check size={12} className="text-[rgba(var(--kw-accent-rgb),1)]" />
            {point}
          </span>
        ))}
      </div>

      <div className="mt-5 rounded-[20px] border border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <label className="block text-sm font-semibold text-[color:var(--kw-ink)]" htmlFor="support-amount">
              Custom amount
            </label>
            <p className="mt-1 max-w-[42ch] text-sm leading-6 text-[color:var(--kw-muted)]">
              Use a custom one-time amount for the same Hifzer assistance scope.
            </p>
          </div>
          {selectedPreset ? (
            <div className="rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.08)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                Selected amount
              </p>
              <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">{selectedPreset.label}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className={clsx(
              "flex h-11 min-w-[220px] items-center rounded-xl border bg-[color:var(--kw-card-strong)] px-3 text-sm text-[color:var(--kw-ink)] shadow-[var(--kw-shadow-soft)] transition",
              "focus-within:border-[rgba(var(--kw-accent-rgb),0.55)] focus-within:ring-4 focus-within:ring-[rgba(var(--kw-accent-rgb),0.16)]",
              amountError
                ? "border-[rgba(225,29,72,0.42)] bg-[rgba(225,29,72,0.06)] focus-within:border-[rgba(225,29,72,0.6)] focus-within:ring-[rgba(225,29,72,0.18)]"
                : "border-[color:var(--kw-border-2)]",
            )}
          >
            <span className="mr-2 text-[color:var(--kw-muted)]">$</span>
            <input
              id="support-amount"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-[color:var(--kw-faint)]"
              placeholder="99.00"
              aria-describedby={amountDescribedBy}
              aria-invalid={amountError ? "true" : undefined}
            />
          </div>

          <Button
            loading={loading}
            disabled={!configured || !ready || !normalizedAmount}
            size="lg"
            className="min-w-[220px] gap-2 sm:flex-1"
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
            Pay ${normalizedAmount || "0.00"} once <ArrowUpRight size={16} />
          </Button>
        </div>
        <p id="support-amount-help" className="mt-2 text-xs leading-6 text-[color:var(--kw-faint)]">
          One-time payment for Hifzer assistance. No subscription is created.
        </p>
        {amountError ? (
          <p
            id="support-amount-error"
            role="alert"
            aria-live="polite"
            className="mt-2 text-sm font-medium text-[color:var(--kw-rose-600)]"
          >
            {amountError}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.08)] p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(var(--kw-accent-rgb),0.22)] bg-white/60 text-[rgba(var(--kw-accent-rgb),1)]">
            <LifeBuoy size={18} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[color:var(--kw-ink)]">What happens after checkout</p>
              <Pill tone="brand" className="gap-1">
                <Sparkles size={12} />
                Written follow-up
              </Pill>
            </div>
            <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">
              Paddle sends the receipt. Send your request through support using the same email so we can match the
              payment to your Hifzer account. This covers written assistance for Hifzer software and account questions;
              it is not a donation, subscription, device repair service, roadmap purchase, or custom development
              guarantee.
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
