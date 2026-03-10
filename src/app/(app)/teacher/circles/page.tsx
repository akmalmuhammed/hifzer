import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listTeacherCircleHub } from "@/hifzer/circles/server";
import { TeacherCirclesClient } from "./teacher-circles-client";

export const metadata = {
  title: "Circles",
};

export default async function TeacherCirclesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const hub = await listTeacherCircleHub(userId);
  if (!hub) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Teacher"
          title="Halaqah / Family circles"
          subtitle="Supervised small groups with weekly targets, oral checks, attendance, and comments."
        />
        <Card>
          <EmptyState
            title="Circles unavailable"
            message="We could not load the current supervision workspace."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher"
        title="Halaqah / Family circles"
        subtitle="Small supervised groups with weekly targets, attendance, oral check status, and parent or teacher comments."
      />
      <TeacherCirclesClient initialHub={hub} />
    </div>
  );
}
