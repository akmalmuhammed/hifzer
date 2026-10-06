"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const SESSION_FLOW_TUTORIAL_STORAGE_KEY = "hifzer_tutorial_session_flow_hidden_v1";

export function isSessionFlowTutorialHidden() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(SESSION_FLOW_TUTORIAL_STORAGE_KEY) === "1";
}

export function setSessionFlowTutorialHidden(hidden: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  if (hidden) {
    window.localStorage.setItem(SESSION_FLOW_TUTORIAL_STORAGE_KEY, "1");
  } else {
    window.localStorage.removeItem(SESSION_FLOW_TUTORIAL_STORAGE_KEY);
  }
}

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
    why: "Your grade controls spacing and keeps tomorrow's review accurate.",
  },
];

type SessionFlowTutorialProps = {
  surface: "dashboard" | "session";
};

export function SessionFlowTutorial(props: SessionFlowTutorialProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [hidden, setHidden] = useState(() => isSessionFlowTutorialHidden());

  const step = useMemo(() => STEPS[stepIndex] ?? STEPS[0], [stepIndex]);
  if (!step || hidden) {
    return null;
  }

  const heading = props.surface === "dashboard"
    ? "Hifz tutorial"
    : "Practice tutorial";
  const subtitle = props.surface === "dashboard"
    ? "This is the flow you will run from the dashboard."
    : "Use this flow while you practice.";

  return (
    <Card
      className="border-[color:var(--kw-border-2)]"
      style={{
        background:
          "var(--kw-card)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{heading}</p>
          <p className="mt-1 text-sm text-[color:var(--kw-muted)]">{subtitle}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSessionFlowTutorialHidden(true);
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
                "min-h-9 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200",
                active
                  ? "bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                  : "bg-[color:var(--kw-fill-strong)] text-[color:var(--kw-ink-2)] hover:bg-[color:var(--kw-hover-strong)]",
              ].join(" ")}
            >
              {index + 1}. {item.title}
            </button>
          );
        })}
      </div>

      <div
        className="mt-3 rounded-[16px] p-4"
        style={{ background: "var(--kw-fill)" }}
      >
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
        <p className="text-xs font-medium tabular-nums text-[color:var(--kw-faint)]">
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
