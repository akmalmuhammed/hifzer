"use client";

import { useEffect, useRef } from "react";
import { Check, Lock, Moon, Sun } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { useTheme, type AccentPreset, type ThemePreset } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";

function paidEnabled(): boolean {
  // Paddle + entitlements will enforce this for real later.
  return false;
}

function OptionRow(props: {
  title: string;
  desc: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[color:var(--kw-ink)]">{props.title}</p>
        <p className="mt-1 text-sm leading-6 text-[color:var(--kw-muted)]">{props.desc}</p>
        {props.children ? <div className="mt-4">{props.children}</div> : null}
      </div>
      {props.right ? <div className="shrink-0">{props.right}</div> : null}
    </div>
  );
}

function SelectPill(props: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        props.disabled
          ? "cursor-not-allowed border-[color:var(--kw-border-2)] bg-white/50 text-[color:var(--kw-faint)]"
          : props.selected
            ? "border-[rgba(var(--kw-accent-rgb),0.26)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
            : "border-[color:var(--kw-border-2)] bg-[color:var(--kw-card)] text-[color:var(--kw-ink)] hover:bg-[color:var(--kw-card-strong)]",
      ].join(" ")}
    >
      {props.selected ? <Check size={14} /> : null}
      <span>{props.label}</span>
      {props.disabled ? <Lock size={14} /> : null}
    </button>
  );
}

export default function DisplaySettingsPage() {
  const { mode, theme, accent, toggleMode, setTheme, setAccent } = useTheme();
  const { pushToast } = useToast();
  const paid = paidEnabled();
  const mountedRef = useRef(false);

  useEffect(() => {
    // Avoid immediate write on initial mount.
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      fetch("/api/profile/display", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          darkMode: mode === "dark",
          themePreset: theme,
          accentPreset: accent,
        }),
      }).catch(() => {
        // Client theme remains active even if persistence fails.
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [accent, mode, theme]);

  function trySetTheme(next: ThemePreset) {
    if (next !== "standard" && !paid) {
      pushToast({ title: "Paid feature", message: "Theme presets unlock on Paid.", tone: "warning" });
      return;
    }
    setTheme(next);
  }

  function trySetAccent(next: AccentPreset) {
    if (next !== "teal" && !paid) {
      pushToast({ title: "Paid feature", message: "Accent presets unlock on Paid.", tone: "warning" });
      return;
    }
    setAccent(next);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Display"
        subtitle="Dark mode is free. Theme and accent presets are shown now; paid gating will be enforced with billing."
      />

      <Card>
        <OptionRow
          title="Mode"
          desc="Switch between light and dark."
          right={
            <Button variant="secondary" className="gap-2" onClick={() => toggleMode()}>
              {mode === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              {mode === "dark" ? "Dark" : "Light"}
            </Button>
          }
        />
      </Card>

      <Card>
        <OptionRow
          title="Theme"
          desc="Standard is free. Paper is a premium preset."
          right={<Pill tone={paid ? "success" : "neutral"}>{paid ? "Paid unlocked" : "Free"}</Pill>}
        >
          <div className="flex flex-wrap gap-2">
            <SelectPill
              label="Standard"
              selected={theme === "standard"}
              onClick={() => trySetTheme("standard")}
            />
            <SelectPill
              label="Paper"
              selected={theme === "paper"}
              disabled={!paid}
              onClick={() => trySetTheme("paper")}
            />
          </div>
        </OptionRow>
      </Card>

      <Card>
        <OptionRow
          title="Accent"
          desc="Teal is free. Additional accents unlock on Paid."
          right={<Pill tone={paid ? "success" : "neutral"}>{paid ? "Paid unlocked" : "Free"}</Pill>}
        >
          <div className="flex flex-wrap gap-2">
            <SelectPill
              label="Teal"
              selected={accent === "teal"}
              onClick={() => trySetAccent("teal")}
            />
            <SelectPill
              label="Cobalt"
              selected={accent === "cobalt"}
              disabled={!paid}
              onClick={() => trySetAccent("cobalt")}
            />
            <SelectPill
              label="Ember"
              selected={accent === "ember"}
              disabled={!paid}
              onClick={() => trySetAccent("ember")}
            />
          </div>
        </OptionRow>
      </Card>
    </div>
  );
}
