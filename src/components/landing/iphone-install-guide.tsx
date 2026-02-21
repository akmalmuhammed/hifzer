"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { Plus, Share } from "lucide-react";

const STEPS = [
  {
    id: "share",
    title: "Tap the Share button in Safari (top-right).",
    detail: "This opens the iPhone share sheet for the current page.",
  },
  {
    id: "more",
    title: "Tap More (if Add to Home Screen is not visible).",
    detail: "Use More to reveal additional actions in the share sheet.",
  },
  {
    id: "add_home",
    title: "Tap Add to Home Screen.",
    detail: "Select the action that creates a home-screen app shortcut.",
  },
  {
    id: "save",
    title: "Tap Add to save.",
    detail: "Hifzer is now installed on your iPhone home screen.",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const TAP_TARGETS: Record<StepId, { x: string; y: string }> = {
  share: { x: "90%", y: "13%" },
  more: { x: "85%", y: "46%" },
  add_home: { x: "85%", y: "57%" },
  save: { x: "84%", y: "84%" },
};

function PulseRing(props: { active: boolean; className?: string }) {
  if (!props.active) {
    return null;
  }

  return (
    <>
      <motion.span
        aria-hidden
        className={clsx(
          "pointer-events-none absolute -inset-1 rounded-[inherit] border-2 border-[rgba(var(--kw-accent-rgb),0.95)]",
          props.className,
        )}
        initial={{ opacity: 0.75, scale: 0.9 }}
        animate={{ opacity: [0.75, 0.15], scale: [0.92, 1.12] }}
        transition={{ duration: 1.15, ease: "easeOut", repeat: Number.POSITIVE_INFINITY }}
      />
      <span
        aria-hidden
        className={clsx(
          "pointer-events-none absolute -inset-1 rounded-[inherit] border border-[rgba(var(--kw-accent-rgb),0.95)]",
          props.className,
        )}
      />
    </>
  );
}

function StepRow(props: { label: string; active: boolean; icon?: ReactNode }) {
  return (
    <div
      className={clsx(
        "relative flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
        props.active
          ? "border-[rgba(var(--kw-accent-rgb),0.55)] bg-[rgba(var(--kw-accent-rgb),0.2)] text-white"
          : "border-white/10 bg-white/5 text-white/85",
      )}
    >
      <PulseRing active={props.active} />
      <span>{props.label}</span>
      <span className="grid h-6 w-6 place-items-center rounded-lg border border-white/20 bg-white/10 text-white/85">
        {props.icon ?? <span className="text-sm font-semibold leading-none">+</span>}
      </span>
    </div>
  );
}

export function IphoneInstallGuide() {
  const reduceMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const timerId = window.setInterval(() => {
      setStepIndex((previous) => (previous + 1) % STEPS.length);
    }, 2400);

    return () => {
      window.clearInterval(timerId);
    };
  }, [reduceMotion]);

  const step = STEPS[stepIndex] ?? STEPS[0];
  const progressLabel = useMemo(() => `${stepIndex + 1}/${STEPS.length}`, [stepIndex]);

  const isActive = (id: StepId) => step.id === id;

  return (
    <div className="rounded-2xl border border-[color:var(--kw-border-2)] bg-white/75 p-4 text-left">
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
        iPhone (Safari)
      </p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--kw-ink-2)]">
        Follow this sequence: Share, More, Add to Home Screen, then Add.
      </p>

      <div className="relative mt-4 rounded-[22px] border border-white/10 bg-[#1e232b] p-3 shadow-[0_18px_38px_rgba(3,8,20,0.45)]">
        {!reduceMotion ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute z-20 h-6 w-6 -translate-x-1/2 -translate-y-1/2"
            animate={{
              left: TAP_TARGETS[step.id].x,
              top: TAP_TARGETS[step.id].y,
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="absolute inset-0 rounded-full border border-white/60 bg-[rgba(var(--kw-accent-rgb),0.6)]"
              animate={{ scale: [1, 0.8, 1], opacity: [0.85, 0.35, 0.85] }}
              transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
          </motion.div>
        ) : null}

        <div className="rounded-2xl bg-[#2a3038] p-3">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-[#3a4048] px-3 py-2 text-xs text-white/80">
            <span className="truncate">hifzer.com</span>
            <div className="relative">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-white/10 text-white">
                <Share size={14} />
              </span>
              <PulseRing active={isActive("share")} className="rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-[#2a3038] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            Share sheet
          </p>
          <div className="mt-2 space-y-2">
            <StepRow label="More" active={isActive("more")} icon={<span className="text-sm leading-none">...</span>} />
            <StepRow label="Add to Home Screen" active={isActive("add_home")} icon={<Plus size={14} />} />
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-[#2a3038] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            Confirm
          </p>
          <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
            <span>Hifzer</span>
            <span className="relative rounded-lg border border-white/25 bg-white/10 px-2 py-1 text-xs font-semibold text-white">
              Add
              <PulseRing active={isActive("save")} />
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.22)] bg-[rgba(var(--kw-accent-rgb),0.08)] px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(var(--kw-accent-rgb),1)]">
          Step {progressLabel}
        </p>
        <p className="mt-1 text-sm font-semibold text-[color:var(--kw-ink)]">{step.title}</p>
        <p className="mt-1 text-xs leading-5 text-[color:var(--kw-muted)]">{step.detail}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStepIndex(0)}
          className="rounded-lg border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--kw-ink)] transition hover:bg-[color:var(--kw-hover-soft)]"
        >
          Replay
        </button>
        <button
          type="button"
          onClick={() => setStepIndex((previous) => (previous + 1) % STEPS.length)}
          className="rounded-lg border border-[color:var(--kw-border)] bg-[color:var(--kw-surface)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--kw-ink)] transition hover:bg-[color:var(--kw-hover-soft)]"
        >
          Next step
        </button>
      </div>
    </div>
  );
}
