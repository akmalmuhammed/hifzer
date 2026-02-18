"use client";

import { useState } from "react";
import { ArrowRight, Bell, BellOff } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";

type RemindersClientProps = {
  initial: {
    emailRemindersEnabled: boolean;
    reminderTimeLocal: string;
    timezone: string;
  };
};

export function RemindersSettingsClient(props: RemindersClientProps) {
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
        throw new Error(payload.error || "Failed to save reminder settings.");
      }
      pushToast({ tone: "success", title: "Saved", message: "Reminder settings updated." });
    } catch (error) {
      pushToast({
        tone: "warning",
        title: "Save failed",
        message: error instanceof Error ? error.message : "Failed to save reminder settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Reminders"
        subtitle="Daily reminder email schedule for your practice days."
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Email reminders</p>
            <p className="mt-1 text-sm leading-7 text-[color:var(--kw-muted)]">
              We send one reminder per local day when you have not completed your session.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone={draft.emailRemindersEnabled ? "success" : "warn"}>
                {draft.emailRemindersEnabled ? "Enabled" : "Disabled"}
              </Pill>
              <Pill tone="neutral">Timezone: {draft.timezone}</Pill>
            </div>
          </div>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => setDraft((d) => ({ ...d, emailRemindersEnabled: !d.emailRemindersEnabled }))}
          >
            {draft.emailRemindersEnabled ? <BellOff size={16} /> : <Bell size={16} />}
            {draft.emailRemindersEnabled ? "Disable" : "Enable"}
          </Button>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">
            Reminder time (local)
          </p>
          <Input
            className="mt-2 max-w-[220px]"
            type="time"
            value={draft.reminderTimeLocal}
            onChange={(e) => setDraft((d) => ({ ...d, reminderTimeLocal: e.target.value }))}
          />
          <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
            The scheduler runs hourly and sends when your local time is near this value.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <Button className="gap-2" loading={saving} onClick={save}>
            Save reminders <ArrowRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
