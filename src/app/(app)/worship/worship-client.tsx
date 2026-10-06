"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  HeartHandshake,
  LockKeyhole,
  MoonStar,
  RefreshCcw,
  ShieldCheck,
  SunMedium,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardSoft } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import type {
  FastingKind,
  FastingStatus,
  PrayerCheckInStatus,
  PrayerName,
  WorshipSnapshot,
  ZakatPlanStatus,
} from "@/hifzer/worship/types";
import styles from "./worship.module.css";
import { mapPublicHttpError, PublicRequestError } from "@/hifzer/errors/public-error";

const PRAYERS: Array<{ key: PrayerName; label: string }> = [
  { key: "FAJR", label: "Fajr" },
  { key: "DHUHR", label: "Dhuhr" },
  { key: "ASR", label: "Asr" },
  { key: "MAGHRIB", label: "Maghrib" },
  { key: "ISHA", label: "Isha" },
];

const PRAYER_STATUS_LABEL: Record<PrayerCheckInStatus, string> = {
  ON_TIME: "On time",
  LATER: "Later",
  EXCUSED: "Excused",
};

const FASTING_STATUS_LABEL: Record<FastingStatus, string> = {
  FASTING: "Fasting",
  COMPLETED: "Completed",
  NOT_FASTING: "Not fasting",
  EXEMPT: "Excused",
};

const FASTING_KIND_LABEL: Record<FastingKind, string> = {
  RAMADAN: "Ramadan",
  MAKE_UP: "Make-up",
  VOLUNTARY: "Voluntary",
  OTHER: "Other",
};

const ZAKAT_STATUS_LABEL: Record<ZakatPlanStatus, string> = {
  DRAFT: "Private draft",
  READY: "Ready to pay",
  PARTIALLY_PAID: "Partly paid",
  PAID: "Paid",
};

function formatMoney(amountMinor: string, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(
      Number(BigInt(amountMinor)) / 100,
    );
  } catch {
    return `${currency} ${amountMinor}`;
  }
}

function updateError(error: unknown): string {
  return error instanceof PublicRequestError
    ? error.publicState.message
    : "Your private update could not be saved. Your previous saved check-ins are unchanged.";
}

async function requestSnapshot(path: string, init?: RequestInit): Promise<WorshipSnapshot> {
  const response = await fetch(path, { cache: "no-store", ...init });
  const payload = (await response.json().catch(() => null)) as { snapshot?: WorshipSnapshot; error?: string } | null;
  if (!response.ok || !payload?.snapshot) {
    throw new PublicRequestError(mapPublicHttpError(response.status, "worship"));
  }
  return payload.snapshot;
}

export function WorshipClient() {
  const [snapshot, setSnapshot] = useState<WorshipSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [zakatAmount, setZakatAmount] = useState("");
  const [zakatCurrency, setZakatCurrency] = useState("QAR");
  const [zakatDueDate, setZakatDueDate] = useState("");
  const [zakatStatus, setZakatStatus] = useState<ZakatPlanStatus>("DRAFT");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [fastingKind, setFastingKind] = useState<FastingKind>("VOLUNTARY");

  async function load() {
    setLoading(true);
    setError(null);
    setAuthRequired(false);
    try {
      const next = await requestSnapshot("/api/worship");
      setSnapshot(next);
    } catch (nextError) {
      setAuthRequired(nextError instanceof PublicRequestError && nextError.publicState.needsSignIn);
      setError(updateError(nextError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const plan = snapshot?.zakat.plan;
    if (!plan) {
      return;
    }
    setZakatAmount((Number(BigInt(plan.amountMinor)) / 100).toFixed(2));
    setZakatCurrency(plan.currency);
    setZakatDueDate(plan.dueDate ?? "");
    setZakatStatus(plan.status);
  }, [snapshot?.zakat.plan]);

  useEffect(() => {
    if (snapshot?.fasting?.kind) {
      setFastingKind(snapshot.fasting.kind);
    }
  }, [snapshot?.fasting?.kind]);

  async function savePrayer(prayer: PrayerName, status: PrayerCheckInStatus | null, expectedVersion?: number) {
    setSavingKey(`prayer:${prayer}`);
    setError(null);
    try {
      setSnapshot(await requestSnapshot("/api/worship/prayer", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prayer, status, expectedVersion }),
      }));
    } catch (nextError) {
      setError(updateError(nextError));
    } finally {
      setSavingKey(null);
    }
  }

  async function saveFasting(status: FastingStatus | null, kind: FastingKind | null = null) {
    setSavingKey("fasting");
    setError(null);
    try {
      setSnapshot(await requestSnapshot("/api/worship/fasting", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, kind, expectedVersion: snapshot?.fasting?.version }),
      }));
    } catch (nextError) {
      setError(updateError(nextError));
    } finally {
      setSavingKey(null);
    }
  }

  async function saveZakatPlan() {
    setSavingKey("zakat-plan");
    setError(null);
    try {
      setSnapshot(await requestSnapshot("/api/worship/zakat", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: zakatAmount,
          currency: zakatCurrency,
          dueDate: zakatDueDate || null,
          status: zakatStatus,
          expectedVersion: snapshot?.zakat.plan?.version,
        }),
      }));
    } catch (nextError) {
      setError(updateError(nextError));
    } finally {
      setSavingKey(null);
    }
  }

  async function addPayment() {
    const plan = snapshot?.zakat.plan;
    if (!plan || !snapshot) {
      return;
    }
    setSavingKey("zakat-payment");
    setError(null);
    try {
      setSnapshot(await requestSnapshot("/api/worship/zakat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount: paymentAmount,
          paidOn: snapshot.today.localDate,
          clientMutationId: crypto.randomUUID(),
        }),
      }));
      setPaymentAmount("");
    } catch (nextError) {
      setError(updateError(nextError));
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return <WorshipSkeleton />;
  }

  if (!snapshot) {
    return (
      <div className="space-y-5">
        <PageHeader eyebrow="Daily worship" title="A quiet place to keep your practice close." />
        <Card className="space-y-4">
          <p className="text-sm leading-7 text-[color:var(--kw-muted)]">{error ?? "Private worship data is unavailable."}</p>
          {authRequired ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild><Link href="/login?redirect_url=%2Fworship">Sign in again</Link></Button>
              <Button asChild variant="secondary"><Link href="/quran/read?view=compact&anon=1">Open reader preview</Link></Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => void load()} className="gap-2"><RefreshCcw /> Try again</Button>
          )}
        </Card>
      </div>
    );
  }

  const prayerByName = new Map(snapshot.prayers.map((checkIn) => [checkIn.prayer, checkIn]));
  const completedPrayerCount = snapshot.prayers.filter((checkIn) => checkIn.status !== "EXCUSED").length;
  const zeroMinor = BigInt(0);
  const paidMinor = snapshot.zakat.plan?.payments.reduce(
    (total, payment) => total + BigInt(payment.amountMinor),
    zeroMinor,
  ) ?? zeroMinor;
  const targetMinor = snapshot.zakat.plan ? BigInt(snapshot.zakat.plan.amountMinor) : zeroMinor;
  const paidPercent = targetMinor > zeroMinor
    ? Math.min(100, Number((paidMinor * BigInt(100)) / targetMinor))
    : 0;

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="Daily worship"
        title="Keep the small things close."
        subtitle="Private check-ins for prayer, fasting, and your annual Zakat plan. No public score. No pressure."
        right={<Button variant="secondary" onClick={() => void load()} className="gap-2"><RefreshCcw /> Refresh</Button>}
      />

      {error ? (
        <CardSoft className="rounded-[18px]! border-transparent! bg-[color:var(--kw-toast-warning-bg)]! text-sm text-[color:var(--kw-toast-warning-fg)]">
          {error}
        </CardSoft>
      ) : null}

      <section className={styles.dailySurface}>
        <div className={styles.dailyGlow} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={completedPrayerCount >= 5 ? "success" : "accent"}>
                {completedPrayerCount >= 5 ? "Prayer circle complete" : `${completedPrayerCount} of 5 checked in`}
              </Pill>
              <Pill tone="neutral">{snapshot.today.localDate}</Pill>
            </div>
            <h2 className="mt-4 text-2xl font-semibold leading-[1.12] tracking-[-0.03em] text-[color:var(--kw-ink)] sm:text-3xl">
              Your day, held with care.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">
              Mark what you want to remember. Hifzer keeps it private to your account and quietly in sync across your devices.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full bg-[color:var(--kw-fill)] px-3.5 py-2">
            <ShieldCheck className="h-4 w-4 text-[rgba(var(--kw-accent-rgb),1)]" />
            <span className="text-[0.82rem] font-medium text-[color:var(--kw-ink-2)]">Private by default</span>
          </div>
        </div>

        <div className="relative mt-6 flex flex-col">
          {PRAYERS.map(({ key, label }) => {
            const checkIn = prayerByName.get(key);
            const busy = savingKey === `prayer:${key}`;
            return (
              <div key={key} className={clsx(styles.prayerTile, "flex flex-wrap items-center gap-x-4 gap-y-3", checkIn && styles.prayerTileComplete)}>
                <div className="flex min-w-[10rem] flex-1 items-center gap-3">
                  <div>
                    <p className="text-base font-semibold tracking-[-0.01em] text-[color:var(--kw-ink)]">{label}</p>
                    <p className="mt-0.5 text-[0.84rem] text-[color:var(--kw-muted)]">
                      {checkIn ? PRAYER_STATUS_LABEL[checkIn.status] : "Not checked in"}
                    </p>
                  </div>
                  {checkIn ? <Check className="order-first h-7 w-7 shrink-0 rounded-full bg-[rgba(var(--kw-accent-rgb),1)] p-1.5 text-white" /> : <SunMedium className="order-first h-7 w-7 shrink-0 rounded-full bg-[color:var(--kw-fill-strong)] p-1.5 text-[color:var(--kw-faint)]" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void savePrayer(key, "ON_TIME", checkIn?.version)}
                    className={clsx(styles.statusButton, checkIn?.status === "ON_TIME" && styles.statusButtonActive)}
                  >
                    On time
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void savePrayer(key, "LATER", checkIn?.version)}
                    className={clsx(styles.statusButton, checkIn?.status === "LATER" && styles.statusButtonActive)}
                  >
                    Later
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void savePrayer(key, "EXCUSED", checkIn?.version)}
                    className={clsx(styles.subtleAction, checkIn?.status === "EXCUSED" && styles.subtleActionActive)}
                  >
                    Excused
                  </button>
                  {checkIn ? (
                    <button type="button" disabled={busy} onClick={() => void savePrayer(key, null, checkIn.version)} className={styles.clearAction}>
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
        <Card className="relative">
          <div className={styles.fastingHalo} />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[color:var(--kw-faint)]"><MoonStar className="h-4 w-4" /><span className="text-[0.82rem] font-semibold">Fasting</span></div>
                <h2 className="mt-3 text-xl font-semibold leading-[1.15] tracking-[-0.025em] text-[color:var(--kw-ink)]">A simple check-in, when it matters.</h2>
                <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">Keep today&apos;s intention private. You do not need to explain it here.</p>
              </div>
              {snapshot.fasting ? <Pill tone="accent">{FASTING_STATUS_LABEL[snapshot.fasting.status]}</Pill> : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["FASTING", "COMPLETED", "NOT_FASTING", "EXEMPT"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={savingKey === "fasting"}
                  onClick={() => void saveFasting(status, status === "FASTING" || status === "COMPLETED" ? fastingKind : null)}
                  className={clsx(styles.fastingChoice, snapshot.fasting?.status === status && styles.fastingChoiceActive)}
                >
                  {FASTING_STATUS_LABEL[status]}
                </button>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-[0.84rem] font-medium text-[color:var(--kw-muted)]">
              <span>When fasting</span>
              <select
                value={fastingKind}
                onChange={(event) => setFastingKind(event.target.value as FastingKind)}
                className={styles.fastingKindSelect}
                aria-label="Fasting type"
              >
                {Object.entries(FASTING_KIND_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {snapshot.fasting ? (
              <button type="button" disabled={savingKey === "fasting"} onClick={() => void saveFasting(null)} className="mt-3 text-[0.84rem] font-medium text-[rgba(var(--kw-accent-rgb),1)] underline-offset-4 hover:underline">Clear fasting check-in</button>
            ) : null}
          </div>
        </Card>

        <Card className="relative">
          <div className={styles.reflectionOrb} />
          <div className="relative flex h-full flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[color:var(--kw-faint)]"><HeartHandshake className="h-4 w-4" /><span className="text-[0.82rem] font-semibold">A gentle return</span></div>
              <h2 className="mt-3 text-xl font-semibold leading-[1.15] tracking-[-0.025em] text-[color:var(--kw-ink)]">Let the rest of your day stay connected.</h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[color:var(--kw-muted)]">Read where you left off, make a dua for what is on your heart, or leave a private reflection before the moment passes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/quran/read?view=compact" className={styles.routeChip}>Continue reading <ChevronRight /></Link>
              <Link href="/dua" className={styles.routeChip}>Open dua <ChevronRight /></Link>
              <Link href="/journal" className={styles.routeChip}>Private journal <ChevronRight /></Link>
            </div>
          </div>
        </Card>
      </div>

      <section className={styles.zakatSurface}>
        <div className={styles.zakatOrbit} />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(420px,1.2fr)] xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="brand">Private annual plan</Pill>
              <Pill tone="neutral"><LockKeyhole className="mr-1 h-3.5 w-3.5" /> Encrypted at rest</Pill>
            </div>
            <h2 className="mt-4 max-w-md text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-[color:var(--kw-ink)]">Make room for your Zakat plan, without turning it into a ledger.</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[color:var(--kw-muted)]">Set a private annual amount, keep a due date close, and record payments when you make them. Hifzer stores the amounts encrypted for your account.</p>
            <p className="mt-4 max-w-lg text-xs leading-6 text-[color:var(--kw-faint)]">This is a private planning record, not a Zakat calculation or religious ruling.</p>
          </div>

          {!snapshot.zakat.encryptionConfigured ? (
            <CardSoft className="rounded-[18px]! border-transparent! bg-[color:var(--kw-fill)]!">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[rgba(var(--kw-accent-rgb),1)]" />
                <div>
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Private Zakat planning is not available on this deployment yet.</p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{snapshot.zakat.unavailableReason ?? "It will appear here once secure private storage is ready."}</p>
                </div>
              </div>
            </CardSoft>
          ) : (
            <div className="space-y-4">
              <CardSoft className="rounded-[18px]! border-transparent! bg-[color:var(--kw-fill)]!">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{snapshot.zakat.plan ? `${snapshot.zakat.plan.periodYear} Zakat plan` : "Start a private Zakat plan"}</p>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--kw-muted)]">Only the amount and payment entries are encrypted.</p>
                  </div>
                  {snapshot.zakat.plan ? <Pill tone={snapshot.zakat.plan.status === "PAID" ? "success" : "accent"}>{ZAKAT_STATUS_LABEL[snapshot.zakat.plan.status]}</Pill> : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_92px]">
                  <label className={styles.fieldLabel}>Annual amount
                    <input value={zakatAmount} onChange={(event) => setZakatAmount(event.target.value)} inputMode="decimal" placeholder="0.00" className={styles.fieldInput} />
                  </label>
                  <label className={styles.fieldLabel}>Currency
                    <input value={zakatCurrency} onChange={(event) => setZakatCurrency(event.target.value.toUpperCase())} maxLength={3} className={styles.fieldInput} />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className={styles.fieldLabel}>Due date
                    <input type="date" value={zakatDueDate} onChange={(event) => setZakatDueDate(event.target.value)} className={styles.fieldInput} />
                  </label>
                  <label className={styles.fieldLabel}>Plan state
                    <select value={zakatStatus} onChange={(event) => setZakatStatus(event.target.value as ZakatPlanStatus)} className={styles.fieldInput}>
                      {Object.entries(ZAKAT_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
                <Button onClick={() => void saveZakatPlan()} loading={savingKey === "zakat-plan"} className="mt-4 w-full gap-2"><LockKeyhole /> Save private plan</Button>
              </CardSoft>

              {snapshot.zakat.plan ? (
                <CardSoft className="rounded-[18px]! border-transparent! bg-[color:var(--kw-fill)]!">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-[rgba(var(--kw-accent-rgb),1)]" /><p className="text-sm font-semibold text-[color:var(--kw-ink)]">Payment record</p></div>
                      <p className="mt-2 text-sm tabular-nums text-[color:var(--kw-muted)]">{formatMoney(paidMinor.toString(), snapshot.zakat.plan.currency)} recorded of {formatMoney(snapshot.zakat.plan.amountMinor, snapshot.zakat.plan.currency)}</p>
                    </div>
                    <span className="text-lg font-semibold tabular-nums tracking-[-0.02em] text-[color:var(--kw-ink)]">{paidPercent}%</span>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[color:var(--kw-track)]"><div className="h-full rounded-full bg-[rgba(var(--kw-accent-rgb),1)]" style={{ width: `${paidPercent}%` }} /></div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} inputMode="decimal" placeholder="Payment amount" className={styles.fieldInput} />
                    <Button variant="secondary" loading={savingKey === "zakat-payment"} onClick={() => void addPayment()} className="shrink-0 gap-2"><CalendarDays /> Record payment</Button>
                  </div>
                </CardSoft>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function WorshipSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading daily worship">
      <div className="h-24 animate-pulse rounded-[var(--kw-radius-xl)] bg-[color:var(--kw-skeleton)]" />
      <div className="h-72 animate-pulse rounded-[var(--kw-radius-xl)] bg-[color:var(--kw-skeleton)]" />
      <div className="grid gap-5 xl:grid-cols-2"><div className="h-64 animate-pulse rounded-[var(--kw-radius-xl)] bg-[color:var(--kw-skeleton)]" /><div className="h-64 animate-pulse rounded-[var(--kw-radius-xl)] bg-[color:var(--kw-skeleton)]" /></div>
    </div>
  );
}
