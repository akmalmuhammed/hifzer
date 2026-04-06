import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress";

const ONBOARDING_STEPS = [
  { key: "welcome", label: "Welcome", note: "See the flow" },
  { key: "assessment", label: "Assessment", note: "Set your pace" },
  { key: "start-point", label: "Start point", note: "Choose where to begin" },
  { key: "plan-preview", label: "Plan preview", note: "Review your first week" },
  { key: "fluency-check", label: "Fluency", note: "Pick your lane" },
  { key: "permissions", label: "Permissions", note: "Optional helpers" },
  { key: "complete", label: "Complete", note: "Launch your dashboard" },
] as const;

export type OnboardingStepKey = typeof ONBOARDING_STEPS[number]["key"];

type SupportPoint = {
  title: string;
  description: ReactNode;
};

type SupportTone = "neutral" | "brand" | "accent" | "warn" | "success" | "danger";

export function OnboardingShell(props: {
  step: OnboardingStepKey;
  title: string;
  subtitle: ReactNode;
  backHref?: string;
  backLabel?: string;
  headerAction?: ReactNode;
  durationHint?: ReactNode;
  supportEyebrow?: ReactNode;
  supportTone?: SupportTone;
  supportTitle: string;
  supportBody: ReactNode;
  supportPoints: SupportPoint[];
  children: ReactNode;
}) {
  const stepIndex = ONBOARDING_STEPS.findIndex((item) => item.key === props.step);
  const currentStep = ONBOARDING_STEPS[stepIndex] ?? ONBOARDING_STEPS[0];
  const totalSteps = ONBOARDING_STEPS.length;
  const progressValue = stepIndex >= 0 ? (stepIndex + 1) / totalSteps : 0;

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-[32px] border border-[rgba(var(--kw-accent-rgb),0.18)] px-5 py-5 shadow-[0_24px_60px_rgba(11,18,32,0.08)] sm:px-6 sm:py-6"
        style={{
          background: [
            "radial-gradient(1200px 320px at -10% -30%, rgba(var(--kw-accent-rgb), 0.16), transparent 58%)",
            "radial-gradient(900px 240px at 110% -35%, rgba(10, 138, 119, 0.14), transparent 56%)",
            "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(246, 248, 252, 0.94))",
          ].join(", "),
        }}
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[rgba(var(--kw-accent-rgb),0.12)] blur-3xl" />
        <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-[rgba(10,138,119,0.12)] blur-3xl" />

        <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="accent">Onboarding</Pill>
              <Pill tone="neutral">
                Step {Math.max(1, stepIndex + 1)} of {totalSteps}
              </Pill>
              <span className="text-xs font-medium text-[color:var(--kw-faint)]">
                {props.durationHint ?? "Built to stay quick, clear, and adjustable later."}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {props.backHref ? (
                <Button asChild variant="secondary" size="sm" className="gap-2">
                  <Link href={props.backHref}>
                    <ChevronLeft size={16} />
                    {props.backLabel ?? "Back"}
                  </Link>
                </Button>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                  Focused setup
                </span>
              )}

              {props.headerAction ? <div className="flex flex-wrap items-center gap-2">{props.headerAction}</div> : null}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                {currentStep.label}
              </p>
              <h1 className="kw-marketing-display mt-3 max-w-[12ch] text-balance text-4xl text-[color:var(--kw-ink)] sm:text-5xl">
                {props.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--kw-muted)]">
                {props.subtitle}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--kw-faint)]">
                <span>{currentStep.note}</span>
                <span>{Math.round(progressValue * 100)}%</span>
              </div>
              <ProgressBar
                value={progressValue}
                tone="accent"
                height={12}
                className="bg-white/70"
                ariaLabel={`Onboarding progress ${Math.max(1, stepIndex + 1)} of ${totalSteps}`}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {ONBOARDING_STEPS.map((item, index) => {
                const state = index < stepIndex ? "complete" : index === stepIndex ? "current" : "upcoming";
                return (
                  <div
                    key={item.key}
                    className={clsx(
                      "rounded-[20px] border px-3 py-3 transition",
                      state === "current" && "border-[rgba(var(--kw-accent-rgb),0.24)] bg-[rgba(var(--kw-accent-rgb),0.09)]",
                      state === "complete" && "border-[rgba(10,138,119,0.20)] bg-[rgba(10,138,119,0.08)]",
                      state === "upcoming" && "border-[color:var(--kw-border-2)] bg-white/68",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={clsx(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          state === "current" && "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.14)] text-[rgba(var(--kw-accent-rgb),1)]",
                          state === "complete" && "border-[rgba(10,138,119,0.24)] bg-[rgba(10,138,119,0.14)] text-[rgb(10,138,119)]",
                          state === "upcoming" && "border-[color:var(--kw-border-2)] bg-white/80 text-[color:var(--kw-faint)]",
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-[color:var(--kw-muted)]">{item.note}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[26px] border border-[rgba(var(--kw-accent-rgb),0.14)] bg-white/82 p-5 shadow-[0_18px_40px_rgba(11,18,32,0.08)] backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={props.supportTone ?? "brand"}>{props.supportEyebrow ?? "Why this matters"}</Pill>
              <span className="text-xs text-[color:var(--kw-faint)]">{currentStep.label}</span>
            </div>

            <p className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
              {props.supportTitle}
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">{props.supportBody}</p>

            <div className="mt-4 space-y-3">
              {props.supportPoints.map((point) => (
                <div
                  key={point.title}
                  className="rounded-[20px] border border-[color:var(--kw-border-2)] bg-white/72 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{point.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">{point.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {props.children}
    </div>
  );
}
