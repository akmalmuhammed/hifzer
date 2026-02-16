import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export const metadata = {
  title: "Onboarding",
};

export default function OnboardingWelcomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Welcome"
        subtitle="A few steps to set your starting point and build a plan you can keep."
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <Pill tone="brand">About</Pill>
            <p className="mt-3 text-sm leading-7 text-[color:var(--kw-muted)]">
              Hifzer is designed for retention. We will ask a few questions, then you will choose any
              surah and an ayah to start from.
            </p>
          </div>
          <Link href="/onboarding/assessment">
            <Button size="lg" className="gap-2">
              Continue <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

