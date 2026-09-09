import type { HTMLAttributes } from "react";
import clsx from "clsx";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CloudOff,
  GitCompareArrows,
  LoaderCircle,
  PencilLine,
} from "lucide-react";

export type SaveDestination = "account" | "device";

export type SaveStatusState =
  | { kind: "not-saved" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "queued" }
  | { kind: "conflict" }
  | { kind: "review" }
  | { kind: "saved"; destination: SaveDestination }
  | { kind: "error"; destination: SaveDestination };

export function resolveSaveStatusState(input: {
  issueDestination: SaveDestination | null;
  isSaving: boolean;
  isDirty: boolean;
  hasPersistedDraft: boolean;
  savedDestination: SaveDestination | null;
  isQueued?: boolean;
  hasConflict?: boolean;
  needsReview?: boolean;
}): SaveStatusState {
  if (input.isSaving) {
    return { kind: "saving" };
  }
  if (input.hasConflict) {
    return { kind: "conflict" };
  }
  if (input.needsReview) {
    return { kind: "review" };
  }
  if (input.issueDestination) {
    return { kind: "error", destination: input.issueDestination };
  }
  if (input.isDirty) {
    return { kind: "dirty" };
  }
  if (input.isQueued) {
    return { kind: "queued" };
  }
  if (input.hasPersistedDraft && input.savedDestination) {
    return { kind: "saved", destination: input.savedDestination };
  }
  return { kind: "not-saved" };
}

export function getSaveStatusCopy(state: SaveStatusState): {
  title: string;
  detail: string;
} {
  if (state.kind === "saving") {
    return {
      title: "Saving…",
      detail: "Keep writing while this browser verifies the latest copy.",
    };
  }
  if (state.kind === "error") {
    return state.destination === "account"
      ? {
          title: "Not saved to your account",
          detail: "Your draft is still open. Check your connection, then retry.",
        }
      : {
          title: "Not saved on this device",
          detail: "Your draft is still open because the browser copy could not be verified. Retry when ready.",
        };
  }
  if (state.kind === "conflict") {
    return {
      title: "Needs your choice",
      detail: "This note also changed elsewhere. Your draft is safe on this device.",
    };
  }
  if (state.kind === "queued") {
    return {
      title: "Saved on this device",
      detail: "Waiting to sync this account note when the connection returns.",
    };
  }
  if (state.kind === "review") {
    return {
      title: "Sync needs review",
      detail: "Your recovery copy remains on this device. Review this note before retrying.",
    };
  }
  if (state.kind === "dirty") {
    return {
      title: "Saving shortly…",
      detail: "Keep writing—changes save automatically.",
    };
  }
  if (state.kind === "saved") {
    return state.destination === "account"
      ? {
          title: "Saved to your account",
          detail: "The account save was confirmed.",
        }
      : {
          title: "Saved on this device",
          detail: "The browser copy was written and read back successfully.",
        };
  }
  return {
    title: "Ready when you are",
    detail: "Start writing and this draft will save automatically.",
  };
}

export function SaveStatus({
  state,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { state: SaveStatusState }) {
  const copy = getSaveStatusCopy(state);
  const tone =
    state.kind === "error"
      ? "error"
      : state.kind === "conflict" || state.kind === "queued" || state.kind === "review"
        ? "warning"
        : state.kind === "saved"
          ? "success"
          : "neutral";
  const StatusIcon =
    state.kind === "error"
      ? AlertTriangle
      : state.kind === "conflict"
        ? GitCompareArrows
        : state.kind === "queued" || state.kind === "review"
          ? CloudOff
      : state.kind === "saved"
        ? CheckCircle2
        : state.kind === "saving"
          ? LoaderCircle
          : state.kind === "dirty"
            ? PencilLine
            : CircleDashed;

  return (
    <div
      className={clsx(
        "flex max-w-[58ch] items-start gap-2.5 rounded-2xl border px-3 py-2.5 text-[0.82rem] leading-6 text-[color:var(--kw-muted)]",
        tone === "error" && "border-[rgba(234,88,12,0.26)] bg-[rgba(234,88,12,0.08)]",
        tone === "success" &&
          "border-[color:var(--kw-pill-success-border)] bg-[color:var(--kw-pill-success-bg)]",
        tone === "warning" && "border-[rgba(202,138,4,0.28)] bg-[rgba(202,138,4,0.08)]",
        tone === "neutral" && "border-[color:var(--kw-border-2)] bg-[color:var(--kw-surface-soft)]",
        className,
      )}
      role={state.kind === "error" || state.kind === "conflict" ? "alert" : "status"}
      aria-live={state.kind === "error" || state.kind === "conflict" ? "assertive" : "polite"}
      {...props}
    >
      <StatusIcon
        aria-hidden="true"
        className={clsx(
          "mt-1 h-4 w-4 shrink-0",
          state.kind === "error" && "text-[color:var(--kw-ember-600)]",
          (state.kind === "conflict" || state.kind === "queued" || state.kind === "review") && "text-amber-700",
          state.kind === "saved" && "text-[color:var(--kw-pill-success-fg)]",
        )}
      />
      <div className="grid gap-0.5">
        <p
          className={clsx(
            "font-semibold text-[color:var(--kw-ink)]",
            state.kind === "error" && "text-[color:var(--kw-ember-600)]",
            (state.kind === "conflict" || state.kind === "queued" || state.kind === "review") && "text-amber-800",
          )}
        >
          {copy.title}
        </p>
        <p>{copy.detail}</p>
      </div>
    </div>
  );
}
