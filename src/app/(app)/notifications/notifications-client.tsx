"use client";

import { useState } from "react";
import { ArrowRight, Bell, BellOff, Clock3, Mail } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";

type NotificationsClientProps = {
  initial: {
    emailRemindersEnabled: boolean;
    reminderTimeLocal: string;
    timezone: string;
  };
};

const PRESETS = [
  { label: "Fajr", time: "05:30" },
  { label: "After Maghrib", time: "18:30" },
  { label: "Evening", time: "20:30" },
] as const;

export function NotificationsClient(props: NotificationsClientProps) {
  const { pushToast } = useToast();
  const [draft, setDraft] = useState(props.initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/reminders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reminderTimeLocal: draft.reminderTimeLocal,
          emailRemindersEnabled: draft.emailRemindersEnabled,
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Failed to save notification settings.");
      }
      pushToast({ tone: "success", title: "Saved", message: "Notification schedule updated." });
    } catch (error) {
      pushToast({
        tone: "warning",
        title: "Save failed",
        message: error instanceof Error ? error.message : "Failed to save notification settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Notifications"
        subtitle="Keep reminders gentle and predictable. Email is the live channel right now; push alerts can come later."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={draft.emailRemindersEnabled ? "success" : "warn"}>
                  {draft.emailRemindersEnabled ? "Email enabled" : "Email disabled"}
                </Pill>
                <Pill tone="neutral">{draft.timezone}</Pill>
              </div>
              <p className="mt-4 text-lg font-semibold tracking-tight text-[color:var(--kw-ink)]">
                Daily reminder timing
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
                Hifzer sends at most one reminder on a local day when you have not yet finished your practice.
              </p>
            </div>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => setDraft((current) => ({
                ...current,
                emailRemindersEnabled: !current.emailRemindersEnabled,
              }))}
            >
              {draft.emailRemindersEnabled ? <BellOff size={16} /> : <Bell size={16} />}
              {draft.emailRemindersEnabled ? "Disable" : "Enable"}
            </Button>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-[color:var(--kw-faint)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Suggested presets</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, reminderTimeLocal: preset.time }))}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    draft.reminderTimeLocal === preset.time
                      ? "border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] text-[rgba(var(--kw-accent-rgb),1)]"
                      : "border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink)] hover:bg-white",
                  ].join(" ")}
                >
                  {preset.label} {preset.time}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <Input
              id="notifications-reminder-time"
              label="Reminder time (local)"
              description="This is your local clock time, not server time. It works best when your timezone stays accurate."
              fieldClassName="max-w-[220px]"
              labelClassName="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]"
              type="time"
              value={draft.reminderTimeLocal}
              onChange={(event) => setDraft((current) => ({ ...current, reminderTimeLocal: event.target.value }))}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button className="gap-2" loading={saving} onClick={save}>
              Save notifications <ArrowRight size={16} />
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Current delivery model</p>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--kw-muted)]">
            <p>Email reminders are live now. They are intentionally simple and non-spammy.</p>
            <p>Push notifications, regional prayer-linked timing, and weekend-heavy plans can layer on top later without changing your core habit loop.</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Pill tone="neutral">One reminder max / day</Pill>
            <Pill tone="neutral">Local timezone aware</Pill>
            <Pill tone="neutral">Simple daily cadence</Pill>
          </div>
        </Card>
      </div>
    </div>
  );
}
