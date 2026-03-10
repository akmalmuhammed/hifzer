import Link from "next/link";
import { Download, Shield, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Privacy",
};

export default function PrivacySettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Privacy"
        subtitle="What Hifzer currently stores, what it does not store yet, and where deletion/export flows will live."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Stored today</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="neutral">Profile settings</Pill>
            <Pill tone="neutral">Session grades</Pill>
            <Pill tone="neutral">Bookmarks</Pill>
            <Pill tone="neutral">Reminder preferences</Pill>
          </div>
          <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
            Hifzer currently persists the data required to run your queue, remember your reader preferences, and report progress back to you.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-[color:var(--kw-faint)]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--kw-faint)]">Not stored yet</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="accent">No microphone uploads</Pill>
            <Pill tone="accent">No teacher recordings</Pill>
            <Pill tone="accent">No word-level audio archive</Pill>
          </div>
          <p className="mt-4 text-sm leading-7 text-[color:var(--kw-muted)]">
            Advanced recitation recording and teacher review workflows are not live yet, so Hifzer is not currently collecting those audio artifacts.
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--kw-ink)]">Export and deletion roadmap</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--kw-muted)]">
              Dedicated export and self-serve deletion flows should become first-class settings pages. Right now, account-level actions are still routed through support and account settings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings/account"
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--kw-border-2)] bg-white/70 px-3 py-2 text-sm font-semibold text-[color:var(--kw-ink)]"
            >
              <Download size={14} />
              Account settings
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--kw-accent-rgb),0.28)] bg-[rgba(var(--kw-accent-rgb),0.12)] px-3 py-2 text-sm font-semibold text-[rgba(var(--kw-accent-rgb),1)]"
            >
              Contact support
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
