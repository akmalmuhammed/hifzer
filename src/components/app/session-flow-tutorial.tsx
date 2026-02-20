"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hifzer_tutorial_session_flow_hidden_v1";

type TutorialStep = {
  key: string;
  title: string;
  what: string;
  why: string;
};

const STEPS: TutorialStep[] = [
  {
    key: "expose",
    title: "Expose",
    what: "Read and listen carefully to anchor the ayah before recall.",
    why: "This creates a clean first imprint so mistakes do not get encoded early.",
  },
  {
    key: "guided",
    title: "Guided",
    what: "Recall with light support before going fully blind.",
    why: "Guided recall bridges understanding to memory without forcing guesswork.",
  },
  {
    key: "blind",
    title: "Blind",
    what: "Recite from memory with text hidden.",
    why: "Blind recall is the real memory test and protects long-term retention.",
  },
  {
    key: "link",
    title: "Link Practice",
    what: "Recite the transition from one ayah to the next.",
    why: "Most slips happen at transitions, so links are trained directly.",
  },
  {
    key: "grade",
    title: "Grade",
    what: "Choose Again, Hard, Good, or Easy after each attempt.",
    why: "Your grade controls spacing and keeps tomorrow's queue accurate.",
  },
];

type SessionFlowTutorialProps = {
  surface: "today" | "session";
};

export function SessionFlowTutorial(props: SessionFlowTutorialProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  const step = useMemo(() => STEPS[stepIndex] ?? STEPS[0], [stepIndex]);
  if (!step || hidden) {
    return null;
  }

  const heading = props.surface === "today"
    ? "Hifz tutorial"
    : "Practice tutorial";
  const subtitle = props.surface === "today"
    ? "This is the flow you will run inside Hifz."
    : "Use this flow while you practice.";

  return (
    <Card className="border-[rgba(var(--kw-accent-rgb),0.24)] bg-[rgba(var(--kw-accent-rgb),0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{heading}</p>
          <p className="mt-1 text-sm text-[color:var(--kw-muted)]">{subtitle}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(STORAGE_KEY, "1");
            }
            setHidden(true);
          }}
        >
          Don&apos;t show again
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STEPS.map((item, index) => {
          const active = index === stepIndex;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setStepIndex(index)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                active
                  ? "border-[rgba(var(--kw-accent-rgb),0.32)] bg-[rgba(var(--kw-accent-rgb),0.18)] text-[color:var(--kw-ink)]"
                  : "border-[color:var(--kw-border)] bg-white/80 text-[color:var(--kw-muted)] hover:bg-white",
              ].join(" ")}
            >
              {index + 1}. {item.title}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-[color:var(--kw-border)] bg-white/80 p-4">
        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{step.title}</p>
        <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
          <span className="font-semibold text-[color:var(--kw-ink)]">What:</span> {step.what}
        </p>
        <p className="mt-1 text-sm text-[color:var(--kw-muted)]">
          <span className="font-semibold text-[color:var(--kw-ink)]">Why:</span> {step.why}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
          disabled={stepIndex === 0}
        >
          Back
        </Button>
        <p className="text-xs font-semibold text-[color:var(--kw-faint)]">
          Step {stepIndex + 1} / {STEPS.length}
        </p>
        <Button
          size="sm"
          onClick={() => setStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1))}
          disabled={stepIndex === STEPS.length - 1}
        >
          Next
        </Button>
      </div>
    </Card>
  );
}
