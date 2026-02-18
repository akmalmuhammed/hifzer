import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = {
  title: "Fluency Check",
};

export default function OnboardingFluencyCheckPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Fluency check"
        subtitle="A live recitation test (UI scaffold). Later: mic capture + AI feedback."
        right={
          <Link href="/onboarding/complete">
            <Button variant="secondary" className="gap-2">
              Skip for now <ArrowRight size={16} />
            </Button>
          </Link>
        }
      />

      <Card>
        <EmptyState
          title="Fluency check not wired yet"
          message="For now, complete onboarding and begin with self-grading. Fluency track can be added next."
          icon={<Mic size={18} />}
          action={
            <Link href="/onboarding/complete">
              <Button className="gap-2">
                Continue <ArrowRight size={16} />
              </Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
