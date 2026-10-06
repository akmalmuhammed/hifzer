import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { ProgressBar } from "@/components/ui/progress";

const ONBOARDING_STEPS = [
  { key: "assessment", label: "Assessment", note: "Set your pace and lane" },
  { key: "start-point", label: "Start point", note: "Choose where to begin" },
  { key: "complete", label: "Complete", note: "Open your dashboard" },
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
    <div className="mx-auto flex w-full max-w-[44rem] flex-col gap-8">
      <section
        className="contents"
      >
        <div className="hidden" />
        <div className="hidden" />

        <div className="contents">
          <div className="flex flex-col gap-6 pt-1 text-center sm:pt-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Pill tone="accent">Onboarding</Pill>
              <Pill tone="neutral">
                Step {Math.max(1, stepIndex + 1)} of {totalSteps}
              </Pill>
              <span className="basis-full text-[0.84rem] font-medium text-[color:var(--kw-faint)]">
                {props.durationHint ?? "Built to stay quick, clear, and adjustable later."}
              </span>
            </div>

            <div className="order-first flex min-h-[var(--kw-control-sm-height)] flex-wrap items-center justify-between gap-3">
              {props.backHref ? (
                <Button asChild variant="secondary" size="sm" className="gap-2">
                  <Link href={props.backHref}>
                    <ChevronLeft size={16} />
                    {props.backLabel ?? "Back"}
                  </Link>
                </Button>
              ) : (
                <span className="text-[0.84rem] font-medium text-[color:var(--kw-faint)]">
                  Focused setup
                </span>
              )}

              {props.headerAction ? <div className="flex flex-wrap items-center gap-2">{props.headerAction}</div> : null}
            </div>

            <div>
              <p className="text-[1.05rem] font-semibold tracking-[-0.014em] text-[rgba(var(--kw-accent-rgb),1)]">
                {currentStep.label}
              </p>
              <h1 className="kw-marketing-display mx-auto mt-2 max-w-[16ch] text-balance text-[clamp(2.3rem,6vw,3.4rem)] leading-[1.06] tracking-[-0.034em] text-[color:var(--kw-ink)]">
                {props.title}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-[1.12rem] leading-[1.45] tracking-[-0.012em] text-[color:var(--kw-muted)]">
                {props.subtitle}
              </p>
            </div>

            <div className="mx-auto w-full max-w-[22rem] space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-[0.8rem] font-medium tabular-nums text-[color:var(--kw-faint)]">
                <span>{currentStep.note}</span>
                <span>{Math.round(progressValue * 100)}%</span>
              </div>
              <ProgressBar
                value={progressValue}
                tone="accent"
                height={4}
                className="bg-[color:var(--kw-track)]"
                ariaLabel={`Onboarding progress ${Math.max(1, stepIndex + 1)} of ${totalSteps}`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {ONBOARDING_STEPS.map((item, index) => {
                const state = index < stepIndex ? "complete" : index === stepIndex ? "current" : "upcoming";
                return (
                  <div
                    key={item.key}
                    className={clsx(
                      "transition-colors duration-200",
                      state === "current" && "text-[color:var(--kw-ink)]",
                      state === "complete" && "text-[color:var(--kw-ink)]",
                      state === "upcoming" && "text-[color:var(--kw-faint)]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.74rem] font-semibold tabular-nums",
                          state === "current" && "bg-[rgba(var(--kw-accent-rgb),1)] text-white",
                          state === "complete" && "bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]",
                          state === "upcoming" && "bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-faint)]",
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.9rem] font-medium">{item.label}</p>
                        <p className="sr-only">{item.note}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-last rounded-[var(--kw-radius-xl)] bg-[color:var(--kw-card)] p-6 text-left sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={props.supportTone ?? "brand"}>{props.supportEyebrow ?? "Why this matters"}</Pill>
              <span className="text-[0.84rem] text-[color:var(--kw-faint)]">{currentStep.label}</span>
            </div>

            <p className="mt-4 text-[1.3rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[color:var(--kw-ink)]">
              {props.supportTitle}
            </p>
            <p className="mt-2 text-[0.98rem] leading-[1.5] text-[color:var(--kw-muted)]">{props.supportBody}</p>

            <div className="mt-4 divide-y divide-[color:var(--kw-border-2)]">
              {props.supportPoints.map((point) => (
                <div
                  key={point.title}
                  className="py-3.5 last:pb-0"
                >
                  <p className="text-[0.98rem] font-semibold text-[color:var(--kw-ink)]">{point.title}</p>
                  <p className="mt-0.5 text-[0.94rem] leading-[1.5] text-[color:var(--kw-muted)]">{point.description}</p>
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
