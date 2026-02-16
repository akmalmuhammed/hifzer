"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { setOnboardingCompleted } from "@/hifzer/local/store";

const ONBOARDED_COOKIE = "hifzer_onboarded_v1";

function setOnboardedCookie() {
  // Non-HttpOnly cookie set from the client as a temporary gate until Prisma-backed profiles exist.
  const maxAgeSeconds = 60 * 60 * 24 * 365;
  document.cookie = `${ONBOARDED_COOKIE}=1; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function OnboardingCompleteClient() {
  const router = useRouter();
  const { pushToast } = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Complete"
        subtitle="You are ready to start your first session."
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm leading-7 text-[color:var(--kw-muted)]">
              Completion is saved locally first for instant UX, then synced to your profile when
              Clerk + Prisma are available.
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-[22px] border border-[rgba(22,163,74,0.26)] bg-[rgba(22,163,74,0.10)] text-[color:var(--kw-lime-600)] shadow-[var(--kw-shadow-soft)]">
            <CheckCircle2 size={18} />
          </span>
        </div>

        <div className="mt-6">
          <Button
            size="lg"
            className="gap-2"
            onClick={async () => {
              setOnboardingCompleted();
              setOnboardedCookie();

              try {
                await fetch("/api/profile/onboarding-complete", { method: "POST" });
              } catch {
                // Local completion still allows progress if API is temporarily unavailable.
              }

              pushToast({ title: "Onboarding complete", message: "Welcome to Hifzer.", tone: "success" });
              router.push("/today");
            }}
          >
            Go to Today <ArrowRight size={18} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
