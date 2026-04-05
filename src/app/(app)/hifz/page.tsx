import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionClient } from "../session/session-client";

export const metadata = {
  title: "Hifz",
};

export default async function HifzPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <Button asChild variant="secondary" className="gap-2">
          <Link href="/hifz/progress">
            Hifz surah progress <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
      <SessionClient />
    </div>
  );
}
