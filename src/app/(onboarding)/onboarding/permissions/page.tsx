import Link from "next/link";
import { ArrowRight, Bell, Mic } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Permissions",
};

export default function OnboardingPermissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Permissions"
        subtitle="We will request microphone and notifications later. This page is a UI scaffold for now."
        right={
          <Link href="/onboarding/complete">
            <Button className="gap-2">
              Continue <ArrowRight size={16} />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill tone="neutral">Microphone</Pill>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Used for live recitation checks and fluency tests.
              </p>
              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                Not requested in this prototype yet.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <Mic size={18} />
            </span>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Pill tone="neutral">Notifications</Pill>
              <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
                Reminders help the habit stick. You will choose a schedule.
              </p>
              <p className="mt-2 text-xs text-[color:var(--kw-faint)]">
                Not requested in this prototype yet.
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[color:var(--kw-border-2)] bg-white/70 text-[color:var(--kw-ink-2)] shadow-[var(--kw-shadow-soft)]">
              <Bell size={18} />
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

