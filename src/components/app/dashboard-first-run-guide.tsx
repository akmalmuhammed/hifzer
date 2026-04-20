"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Gauge,
  Headphones,
  Link2,
  Mic,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import {
  dismissDashboardFirstRunGuide,
  getOnboardingStartLane,
  shouldShowDashboardFirstRunGuide,
} from "@/hifzer/local/store";
import type { OnboardingStartLane } from "@/hifzer/profile/onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress";

type GuidePillTone = "neutral" | "brand" | "accent" | "warn" | "success" | "danger";

type DashboardGuideOverview = {
  profile: {
    mode: "NORMAL" | "CONSOLIDATION" | "CATCH_UP";
    dailyMinutes: number;
  };
  today: {
    status: "idle" | "in_progress" | "completed";
  };
  reviewHealth: {
    dueNow: number;
    dueSoon6h: number;
    weakTransitions: number;
    reviewDebtMinutes: number;
    debtRatioPct: number;
  };
};

type GuideHighlight = {
  label: string;
  value: string;
  tone?: GuidePillTone;
};

type GuideStep = {
  key: string;
  label: string;
  note: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  highlights: GuideHighlight[];
};

function todayStatusLabel(status: DashboardGuideOverview["today"]["status"]): string {
  if (status === "completed") {
    return "Done today";
  }
  if (status === "in_progress") {
    return "In progress";
  }
  return "Not started today";
}

function modeLabel(mode: DashboardGuideOverview["profile"]["mode"]): string {
  if (mode === "CATCH_UP") {
    return "Catch-up";
  }
  if (mode === "CONSOLIDATION") {
    return "Consolidation";
  }
  return "Normal";
}

function debtTone(ratio: number): GuidePillTone {
  if (ratio >= 45) {
    return "danger";
  }
  if (ratio >= 25) {
    return "warn";
  }
  return "success";
}

function debtLabel(ratio: number): string {
  if (ratio >= 45) {
    return "Heavy catch-up";
  }
  if (ratio >= 25) {
    return "Building up";
  }
  return "Steady";
}

function nextActionStep(lane: OnboardingStartLane | null, overview: DashboardGuideOverview): GuideStep {
  const reviewNote = overview.reviewHealth.dueNow > 0
    ? `${overview.reviewHealth.dueNow} due now`
    : "Today is light";
  const highlights: GuideHighlight[] = [
    { label: "Today status", value: todayStatusLabel(overview.today.status), tone: "neutral" },
    { label: "Due now", value: String(overview.reviewHealth.dueNow), tone: overview.reviewHealth.dueNow > 0 ? "warn" : "success" },
    { label: "Weak links", value: String(overview.reviewHealth.weakTransitions), tone: overview.reviewHealth.weakTransitions > 0 ? "warn" : "neutral" },
  ];

  if (lane === "fluency") {
    return {
      key: "fluency",
      label: "Next action",
      note: `Guided fluency | ${reviewNote}`,
      title: "Start with fluency.",
      body: "Steady the sound first, then come back to Hifz.",
      href: "/fluency",
      cta: "Open fluency",
      icon: Mic,
      highlights,
    };
  }

  if (lane === "listen") {
    return {
      key: "listen",
      label: "Next action",
      note: `Listen and repeat | ${reviewNote}`,
      title: "Begin with listen and repeat.",
      body: "Settle pronunciation and rhythm first.",
      href: "/fluency/lesson/listen-repeat",
      cta: "Open listen-repeat",
      icon: Headphones,
      highlights,
    };
  }

  if (lane === "transitions") {
    return {
      key: "transitions",
      label: "Next action",
      note: `Transition repair | ${reviewNote}`,
      title: "Fix joins first.",
      body: "Your weak spot is transitions, so start there.",
      href: "/fluency/lesson/transitions",
      cta: "Open transitions",
      icon: Link2,
      highlights,
    };
  }

  return {
    key: "hifz",
    label: "Next action",
    note: `Main Hifz flow | ${reviewNote}`,
    title: overview.reviewHealth.dueNow > 0
      ? "Open Hifz and clear due review first."
      : "Open Hifz and begin the next block.",
    body: overview.reviewHealth.dueNow > 0
      ? "Review first, then add more."
      : "Today is light, so this is a good time to continue.",
    href: "/hifz",
    cta: "Open Hifz",
    icon: PlayCircle,
    highlights,
  };
}

function queueHealthStep(overview: DashboardGuideOverview): GuideStep {
  return {
    key: "queue-health",
    label: "Today",
    note: `${overview.reviewHealth.dueNow} due now | ${overview.reviewHealth.dueSoon6h} due soon`,
    title: "Check today's review first.",
    body: "Due now comes first. Weak links are joins worth revisiting.",
    href: "/hifz",
    cta: "Open Hifz plan",
    icon: RefreshCcw,
    highlights: [
      { label: "Due now", value: String(overview.reviewHealth.dueNow), tone: overview.reviewHealth.dueNow > 0 ? "warn" : "success" },
      { label: "Due soon", value: String(overview.reviewHealth.dueSoon6h), tone: overview.reviewHealth.dueSoon6h > 0 ? "accent" : "neutral" },
      { label: "Weak links", value: String(overview.reviewHealth.weakTransitions), tone: overview.reviewHealth.weakTransitions > 0 ? "warn" : "neutral" },
    ],
  };
}

function debtRatioStep(overview: DashboardGuideOverview): GuideStep {
  const roundedRatio = `${Math.round(overview.reviewHealth.debtRatioPct)}%`;
  const roundedMinutes = `${Math.round(overview.reviewHealth.reviewDebtMinutes)} min`;

  let body = "This shows how much of today is likely to go to review.";
  if (overview.reviewHealth.debtRatioPct >= 45) {
    body = `About ${roundedMinutes} is waiting inside a ${overview.profile.dailyMinutes} minute day. Clear backlog first.`;
  } else if (overview.reviewHealth.debtRatioPct >= 25) {
    body = `About ${roundedMinutes} is waiting inside a ${overview.profile.dailyMinutes} minute day. Slow down and protect what you have.`;
  }

  return {
    key: "debt-ratio",
    label: "Load",
    note: `${roundedRatio} of today budget`,
    title: "Today's load shows when review is crowding out new work.",
    body,
    href: "/hifz",
    cta: "See today's plan",
    icon: Gauge,
    highlights: [
      { label: "Workload", value: roundedRatio, tone: debtTone(overview.reviewHealth.debtRatioPct) },
      { label: "Review time", value: roundedMinutes, tone: "neutral" },
      { label: "Daily plan", value: `${overview.profile.dailyMinutes} min`, tone: "accent" },
    ],
  };
}

function modeStep(overview: DashboardGuideOverview): GuideStep {
  const mode = overview.profile.mode;
  let body = "Normal keeps review and new work balanced.";

  if (mode === "CONSOLIDATION") {
    body = "Consolidation slows new work so retention can settle.";
  } else if (mode === "CATCH_UP") {
    body = "Catch-up means recent review needs attention before you add more.";
  }

  return {
    key: "srs-mode",
    label: "Mode",
    note: `${modeLabel(mode)} | ${debtLabel(overview.reviewHealth.debtRatioPct)}`,
    title: `${modeLabel(mode)} mode shapes today.`,
    body,
    href: "/hifz",
    cta: "Practice in Hifz",
    icon: ShieldCheck,
    highlights: [
      { label: "Current mode", value: modeLabel(mode), tone: mode === "NORMAL" ? "accent" : mode === "CONSOLIDATION" ? "warn" : "danger" },
      { label: "Today status", value: todayStatusLabel(overview.today.status), tone: "neutral" },
      { label: "Review load", value: debtLabel(overview.reviewHealth.debtRatioPct), tone: debtTone(overview.reviewHealth.debtRatioPct) },
    ],
  };
}

export function DashboardFirstRunGuide(props: {
  overview: DashboardGuideOverview;
  initialLane?: OnboardingStartLane | null;
}) {
  const [visible, setVisible] = useState(() => shouldShowDashboardFirstRunGuide());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const lane = props.initialLane ?? getOnboardingStartLane();

  const steps: GuideStep[] = [
    nextActionStep(lane, props.overview),
    queueHealthStep(props.overview),
    debtRatioStep(props.overview),
    modeStep(props.overview),
  ];

  const step = steps[selectedIndex] ?? steps[0];
  const Icon = step.icon;

  if (!visible || !step) {
    return null;
  }

  return (
    <Card
      className="border-[rgba(var(--kw-accent-rgb),0.24)]"
      style={{
        background: [
          "linear-gradient(145deg, rgba(var(--kw-accent-rgb), 0.08), rgba(255, 255, 255, 0.18))",
          "var(--kw-panel-gradient-soft)",
        ].join(", "),
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="accent">Quick start</Pill>
            <Pill tone="neutral">New dashboard</Pill>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            Start here.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
            {"These tips show what to open first and how full today's review is."}
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            dismissDashboardFirstRunGuide();
            setVisible(false);
          }}
        >
          Hide guide
        </Button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
            <span>
              Step {selectedIndex + 1} of {steps.length}
            </span>
            <span>{Math.round(((selectedIndex + 1) / steps.length) * 100)}%</span>
          </div>
          <ProgressBar
            value={(selectedIndex + 1) / steps.length}
            tone="accent"
            height={10}
            ariaLabel={`Dashboard first-run guide ${selectedIndex + 1} of ${steps.length}`}
          />

          {steps.map((item, index) => {
            const active = index === selectedIndex;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-pressed={active}
                className={[
                  "w-full rounded-[20px] border px-4 py-3 text-left transition",
                  active
                    ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.10)] shadow-[0_16px_30px_rgba(11,18,32,0.08)]"
                    : "border-[color:var(--kw-border-2)] bg-white/70 hover:bg-white",
                ].join(" ")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">{item.note}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-white/82 p-5 shadow-[0_18px_38px_rgba(11,18,32,0.08)]">
          <span className="grid h-12 w-12 place-items-center rounded-[20px] border border-[rgba(var(--kw-accent-rgb),0.18)] bg-[rgba(var(--kw-accent-rgb),0.10)] text-[rgba(var(--kw-accent-rgb),1)] shadow-[var(--kw-shadow-soft)]">
            <Icon size={20} />
          </span>

          <p className="mt-4 text-xl font-semibold tracking-tight text-[color:var(--kw-ink)]">
            {step.title}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--kw-muted)]">{step.body}</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {step.highlights.map((item) => (
              <div
                key={`${step.key}-${item.label}`}
                className="rounded-[18px] border border-[color:var(--kw-border-2)] bg-white/72 px-3 py-3"
              >
                <Pill tone={item.tone ?? "neutral"}>{item.label}</Pill>
                <p className="mt-2 text-sm font-semibold text-[color:var(--kw-ink)]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button asChild className="gap-2">
              <Link href={step.href}>
                {step.cta} <ArrowRight size={16} />
              </Link>
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setSelectedIndex((current) => Math.min(steps.length - 1, current + 1))}
              disabled={selectedIndex === steps.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
